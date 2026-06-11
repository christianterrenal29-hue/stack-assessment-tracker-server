import { Rubric } from '../models/Rubric';
import { Question } from '../models/Question';
import { Assessment } from '../models/Assessment';
import { AppError } from '../middleware/errorHandler';

type RubricLevelInput = {
  level: string;
  points: number;
  description: string;
};

export class RubricService {
  static async getAllRubrics(filters?: any) {
    const query: any = {};

    if (filters?.assessment) query.assessment = filters.assessment;
    if (filters?.educator) query.educator = filters.educator;

    const rubrics = await Rubric.find(query)
      .populate('assessment')
      .populate('educator')
      .lean();

    return rubrics;
  }

  static async getRubricById(rubricId: string) {
    const rubric = await Rubric.findById(rubricId)
      .populate('assessment')
      .populate('educator');

    if (!rubric) {
      throw new AppError(404, 'Rubric not found');
    }

    return rubric;
  }

  static async createRubric(rubricData: any) {
    const { name, description, assessment, educator, criteria } = rubricData;

    if (!name || !assessment || !educator || !criteria || criteria.length === 0) {
      throw new AppError(400, 'Name, assessment, educator, and criteria are required');
    }

    // Verify assessment and educator exist
    const assessmentExists = await Assessment.findById(assessment);
    if (!assessmentExists) {
      throw new AppError(404, 'Assessment not found');
    }

    // Calculate total points from criteria
    const totalPoints = criteria.reduce((sum: number, criterion: any) => {
      const maxScore = criterion.levels.reduce((max: number, level: any) => 
        Math.max(max, level.points), 0);
      return sum + maxScore;
    }, 0);

    const rubric = new Rubric({
      name,
      description,
      assessment,
      educator,
      criteria,
      totalPoints,
    });

    await rubric.save();
    return await rubric.populate(['assessment', 'educator']);
  }

  static async updateRubric(rubricId: string, updateData: any) {
    const { name, description, criteria } = updateData;

    let totalPoints = undefined;
    if (criteria) {
      totalPoints = criteria.reduce((sum: number, criterion: any) => {
        const maxScore = criterion.levels.reduce((max: number, level: any) => 
          Math.max(max, level.points), 0);
        return sum + maxScore;
      }, 0);
    }

    const rubric = await Rubric.findByIdAndUpdate(
      rubricId,
      {
        name,
        description,
        criteria,
        ...(totalPoints !== undefined && { totalPoints }),
      },
      { new: true }
    )
      .populate('assessment')
      .populate('educator');

    if (!rubric) {
      throw new AppError(404, 'Rubric not found');
    }

    return rubric;
  }

  static async deleteRubric(rubricId: string) {
    const rubric = await Rubric.findById(rubricId);

    if (!rubric) {
      throw new AppError(404, 'Rubric not found');
    }

    // Remove rubric references from questions
    await Question.updateMany(
      { rubric: rubricId },
      { $unset: { rubric: 1 } }
    );

    await Rubric.findByIdAndDelete(rubricId);

    return { message: 'Rubric deleted successfully' };
  }

  static async getRubricsByAssessment(assessmentId: string) {
    const rubrics = await Rubric.find({ assessment: assessmentId })
      .populate('assessment')
      .populate('educator')
      .lean();

    return rubrics;
  }

  static async getRubricsByEducator(educatorId: string) {
    const rubrics = await Rubric.find({ educator: educatorId })
      .populate('assessment')
      .populate('educator')
      .lean();

    return rubrics;
  }

  static async addCriterion(rubricId: string, criterionData: any) {
    const { name, description, levels } = criterionData;

    if (!name || !levels || levels.length === 0) {
      throw new AppError(400, 'Name and levels are required');
    }

    const rubric = await Rubric.findById(rubricId);

    if (!rubric) {
      throw new AppError(404, 'Rubric not found');
    }

    // Create new criterion
    const maxPoints = levels.reduce((max: number, level: RubricLevelInput) =>
      Math.max(max, level.points), 0);
    const newCriterion = {
      criterion: name,
      description,
      maxPoints,
      levels,
    };

    rubric.criteria.push(newCriterion);

    // Recalculate total points
    const totalPoints = rubric.criteria.reduce((sum: number, criterion: any) => {
      const maxScore = criterion.levels.reduce((max: number, level: any) => 
        Math.max(max, level.points), 0);
      return sum + maxScore;
    }, 0);

    rubric.totalPoints = totalPoints;
    await rubric.save();

    return await rubric.populate(['assessment', 'educator']);
  }

  static async removeCriterion(rubricId: string, criterionIndex: number) {
    const rubric = await Rubric.findById(rubricId);

    if (!rubric) {
      throw new AppError(404, 'Rubric not found');
    }

    if (criterionIndex < 0 || criterionIndex >= rubric.criteria.length) {
      throw new AppError(400, 'Invalid criterion index');
    }

    rubric.criteria.splice(criterionIndex, 1);

    // Recalculate total points
    const totalPoints = rubric.criteria.reduce((sum: number, criterion: any) => {
      const maxScore = criterion.levels.reduce((max: number, level: any) => 
        Math.max(max, level.points), 0);
      return sum + maxScore;
    }, 0);

    rubric.totalPoints = totalPoints;
    await rubric.save();

    return await rubric.populate(['assessment', 'educator']);
  }
}
