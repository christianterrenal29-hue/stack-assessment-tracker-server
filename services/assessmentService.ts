import { Assessment } from '../models/Assessment';
import { IQuestion, Question } from '../models/Question';
import { AppError } from '../middleware/errorHandler';

export class AssessmentService {
  static async getAllAssessments(filters?: any) {
    const query: any = {};
    
    if (filters?.educator) query.educator = filters.educator;
    if (filters?.department) query.department = filters.department;
    if (filters?.status) query.status = filters.status;
    if (filters?.institution) query.institution = filters.institution;

    const assessments = await Assessment.find(query)
      .populate('educator')
      .populate('department')
      .populate('institution')
      .populate('questions')
      .lean();

    return assessments;
  }

  static async getAssessmentById(assessmentId: string) {
    const assessment = await Assessment.findById(assessmentId)
      .populate('educator')
      .populate('department')
      .populate('institution')
      .populate('questions');

    if (!assessment) {
      throw new AppError(404, 'Assessment not found');
    }

    return assessment;
  }

  static async createAssessment(assessmentData: any) {
    const { title, description, type, educator, department, institution, duration, totalPoints } = assessmentData;

    if (!title || !type || !educator || !institution) {
      throw new AppError(400, 'Title, type, educator, and institution are required');
    }

    const assessment = new Assessment({
      title,
      description,
      type,
      createdBy: educator,
      educator,
      instructor: educator,
      department,
      institution,
      duration,
      totalPoints: totalPoints || 100,
      status: 'draft',
      questions: [],
    });

    await assessment.save();
    return await assessment.populate(['educator', 'department', 'institution']);
  }

  static async updateAssessment(assessmentId: string, updateData: any) {
    const { title, description, duration, totalPoints, status } = updateData;

    const assessment = await Assessment.findByIdAndUpdate(
      assessmentId,
      {
        title,
        description,
        duration,
        totalPoints,
        status,
      },
      { new: true }
    )
      .populate('educator')
      .populate('department')
      .populate('institution')
      .populate('questions');

    if (!assessment) {
      throw new AppError(404, 'Assessment not found');
    }

    return assessment;
  }

  static async deleteAssessment(assessmentId: string) {
    const assessment = await Assessment.findById(assessmentId);

    if (!assessment) {
      throw new AppError(404, 'Assessment not found');
    }

    // Delete all questions associated with this assessment
    await Question.deleteMany({ assessment: assessmentId });

    // Delete assessment
    await Assessment.findByIdAndDelete(assessmentId);

    return { message: 'Assessment and all its questions deleted successfully' };
  }

  static async publishAssessment(assessmentId: string) {
    const assessment = await Assessment.findById(assessmentId);

    if (!assessment) {
      throw new AppError(404, 'Assessment not found');
    }

    if (assessment.questions.length === 0) {
      throw new AppError(400, 'Cannot publish assessment without questions');
    }

    assessment.status = 'published';
    assessment.publishedAt = new Date();
    await assessment.save();

    return await assessment.populate(['educator', 'department', 'institution', 'questions']);
  }

  static async getAssessmentsByEducator(educatorId: string) {
    const assessments = await Assessment.find({ educator: educatorId })
      .populate('educator')
      .populate('department')
      .populate('institution')
      .populate('questions')
      .lean();

    return assessments;
  }

  static async getAssessmentsByDepartment(departmentId: string) {
    const assessments = await Assessment.find({ department: departmentId })
      .populate('educator')
      .populate('department')
      .populate('institution')
      .populate('questions')
      .lean();

    return assessments;
  }

  static async searchAssessments(query: string) {
    const assessments = await Assessment.find({
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
      ],
    })
      .populate('educator')
      .populate('department')
      .populate('institution')
      .limit(20);

    return assessments;
  }

  static async duplicateAssessment(assessmentId: string, newTitle: string) {
    const originalAssessment = await Assessment.findById(assessmentId)
      .populate('questions');

    if (!originalAssessment) {
      throw new AppError(404, 'Assessment not found');
    }

    // Create new assessment
    const newAssessment = new Assessment({
      title: newTitle,
      description: originalAssessment.description,
      type: originalAssessment.type,
      createdBy: originalAssessment.createdBy || originalAssessment.educator,
      educator: originalAssessment.educator,
      instructor: originalAssessment.instructor || originalAssessment.educator,
      department: originalAssessment.department,
      institution: originalAssessment.institution,
      duration: originalAssessment.duration,
      totalPoints: originalAssessment.totalPoints,
      status: 'draft',
      questions: [],
    });

    await newAssessment.save();

    // Duplicate questions
    const questionIds = [];
    const questions = originalAssessment.questions as unknown as IQuestion[];
    for (const question of questions) {
      const newQuestion = new Question({
        assessment: newAssessment._id,
        text: question.text,
        type: question.type,
        points: question.points,
        options: question.options,
        correctAnswer: question.correctAnswer,
        rubric: question.rubric,
        order: question.order,
      });

      await newQuestion.save();
      questionIds.push(newQuestion._id);
    }

    newAssessment.questions = questionIds;
    await newAssessment.save();

    return await newAssessment.populate(['educator', 'department', 'institution', 'questions']);
  }
}
