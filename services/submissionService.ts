import { Types } from 'mongoose';
import { Submission } from '../models/Submission';
import { GradingRecord } from '../models/GradingRecord';
import { AppError } from '../middleware/errorHandler';

type CreateSubmissionInput = {
  assessment: string;
  student: string;
  distributedAssessment?: string;
  answers?: Array<{
    questionId: string;
    answerType: 'mcq' | 'short-answer' | 'essay' | 'file-upload';
    answer: unknown;
  }>;
  status?: 'draft' | 'submitted';
};

type GradeSubmissionInput = {
  grades?: Array<{
    questionId: string;
    score: number;
    rubricScores?: Array<{
      criterion: string;
      score: number;
      feedback: string;
    }>;
    feedback?: string;
  }>;
  totalScore?: number;
  totalPoints?: number;
  overallFeedback?: string;
};

const toObjectId = (id: string, fieldName: string): Types.ObjectId => {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError(400, `Invalid ${fieldName}`);
  }

  return new Types.ObjectId(id);
};

export class SubmissionService {
  static async getAllSubmissions() {
    return Submission.find()
      .populate('assessment')
      .populate('student', 'firstName lastName email role')
      .sort({ createdAt: -1 });
  }

  static async getSubmissionById(submissionId: string) {
    const submission = await Submission.findById(toObjectId(submissionId, 'submission id'))
      .populate('assessment')
      .populate('student', 'firstName lastName email role');

    if (!submission) {
      throw new AppError(404, 'Submission not found');
    }

    return submission;
  }

  static async createSubmission(payload: CreateSubmissionInput) {
    const submission = new Submission({
      assessment: toObjectId(payload.assessment, 'assessment id'),
      student: toObjectId(payload.student, 'student id'),
      distributedAssessment: payload.distributedAssessment
        ? toObjectId(payload.distributedAssessment, 'distributed assessment id')
        : undefined,
      answers: payload.answers?.map((answer) => ({
        ...answer,
        questionId: toObjectId(answer.questionId, 'question id'),
        submittedAt: new Date(),
      })) ?? [],
      submittedAt: payload.status === 'submitted' ? new Date() : undefined,
      status: payload.status ?? 'submitted',
    });

    await submission.save();
    return this.getSubmissionById(submission._id.toString());
  }

  static async gradeSubmission(submissionId: string, gradedBy: string, payload: GradeSubmissionInput) {
    const submission = await Submission.findById(toObjectId(submissionId, 'submission id'));

    if (!submission) {
      throw new AppError(404, 'Submission not found');
    }

    const totalScore = payload.totalScore ?? payload.grades?.reduce((sum, grade) => sum + grade.score, 0) ?? 0;
    const totalPoints = payload.totalPoints ?? Math.max(totalScore, 1);
    const percentage = totalPoints > 0 ? (totalScore / totalPoints) * 100 : 0;

    const gradingRecord = await GradingRecord.findOneAndUpdate(
      { submission: submission._id },
      {
        submission: submission._id,
        gradedBy: toObjectId(gradedBy, 'grader id'),
        grades: payload.grades?.map((grade) => ({
          ...grade,
          questionId: toObjectId(grade.questionId, 'question id'),
          rubricScores: grade.rubricScores ?? [],
          feedback: grade.feedback ?? '',
        })) ?? [],
        totalScore,
        totalPoints,
        percentage,
        overallFeedback: payload.overallFeedback ?? '',
        gradedAt: new Date(),
      },
      { new: true, upsert: true, runValidators: true }
    );

    submission.status = 'graded';
    submission.markedAt = new Date();
    await submission.save();

    return {
      submission: await this.getSubmissionById(submission._id.toString()),
      grading: gradingRecord,
    };
  }
}
