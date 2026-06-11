import { IQuestion, Question } from '../models/Question';
import { Assessment } from '../models/Assessment';
import { AppError } from '../middleware/errorHandler';

export class QuestionService {
  static async getQuestionsByAssessment(assessmentId: string) {
    const questions = await Question.find({ assessment: assessmentId })
      .sort({ order: 1 })
      .lean();

    return questions;
  }

  static async getQuestionById(questionId: string) {
    const question = await Question.findById(questionId);

    if (!question) {
      throw new AppError(404, 'Question not found');
    }

    return question;
  }

  static async createQuestion(questionData: any) {
    const { assessment, text, type, points, options, correctAnswer, rubric } = questionData;

    if (!assessment || !text || !type) {
      throw new AppError(400, 'Assessment, text, and type are required');
    }

    // Verify assessment exists
    const assessmentExists = await Assessment.findById(assessment);
    if (!assessmentExists) {
      throw new AppError(404, 'Assessment not found');
    }

    // Get the order (number of existing questions + 1)
    const questionCount = await Question.countDocuments({ assessment });
    const order = questionCount + 1;

    const question = new Question({
      assessment,
      text,
      type,
      points: points || 1,
      options,
      correctAnswer,
      rubric,
      order,
    });

    await question.save();

    // Add question to assessment
    assessmentExists.questions.push(question._id);
    await assessmentExists.save();

    return question;
  }

  static async updateQuestion(questionId: string, updateData: any) {
    const { text, type, points, options, correctAnswer, rubric } = updateData;

    const question = await Question.findByIdAndUpdate(
      questionId,
      {
        text,
        type,
        points,
        options,
        correctAnswer,
        rubric,
      },
      { new: true }
    );

    if (!question) {
      throw new AppError(404, 'Question not found');
    }

    return question;
  }

  static async deleteQuestion(questionId: string) {
    const question = await Question.findById(questionId);

    if (!question) {
      throw new AppError(404, 'Question not found');
    }

    // Remove from assessment
    await Assessment.findByIdAndUpdate(
      question.assessment,
      { $pull: { questions: questionId } }
    );

    await Question.findByIdAndDelete(questionId);

    return { message: 'Question deleted successfully' };
  }

  static async reorderQuestions(assessmentId: string, questionIds: string[]) {
    for (let i = 0; i < questionIds.length; i++) {
      await Question.findByIdAndUpdate(
        questionIds[i],
        { order: i + 1 }
      );
    }

    return { message: 'Questions reordered successfully' };
  }

  static async bulkCreateQuestions(assessmentId: string, questionsData: any[]) {
    const assessmentExists = await Assessment.findById(assessmentId);
    if (!assessmentExists) {
      throw new AppError(404, 'Assessment not found');
    }

    const questionCount = await Question.countDocuments({ assessment: assessmentId });
    const createdQuestions = [];
    const errors = [];

    for (let i = 0; i < questionsData.length; i++) {
      try {
        const questionData = questionsData[i];

        if (!questionData.text || !questionData.type) {
          errors.push({
            row: i + 1,
            error: 'Text and type are required',
          });
          continue;
        }

        const question = new Question({
          assessment: assessmentId,
          text: questionData.text,
          type: questionData.type,
          points: questionData.points || 1,
          options: questionData.options,
          correctAnswer: questionData.correctAnswer,
          rubric: questionData.rubric,
          order: questionCount + i + 1,
        });

        await question.save();
        createdQuestions.push(question);
        assessmentExists.questions.push(question._id);
      } catch (error: any) {
        errors.push({
          row: i + 1,
          error: error.message,
        });
      }
    }

    await assessmentExists.save();

    return {
      created: createdQuestions.length,
      total: questionsData.length,
      createdQuestions,
      errors,
    };
  }

  static async getQuestionsByType(assessmentId: string, type: string) {
    const questionType = type as IQuestion['type'];
    const questions = await Question.find({ assessment: assessmentId, type: questionType })
      .sort({ order: 1 })
      .lean();

    return questions;
  }
}
