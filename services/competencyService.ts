import mongoose from 'mongoose';
import Competency from '../models/Competency';

export class CompetencyService {
  async createCompetency(competencyData: any, createdBy: string) {
    const competency = new Competency({
      code: competencyData.code,
      title: competencyData.title,
      description: competencyData.description,
      qualification: competencyData.qualification,
      assessmentCriteria: competencyData.assessmentCriteria || [],
      passingScore: competencyData.passingScore || 75,
      createdBy,
    });

    return await competency.save();
  }

  async getCompetencyById(competencyId: string) {
    return await Competency.findById(competencyId)
      .populate('qualification', 'code title')
      .populate('createdBy', 'firstName lastName');
  }

  async getCompetenciesByQualification(qualificationId: string) {
    const objectId = new mongoose.Types.ObjectId(qualificationId);

    return await Competency.find({ qualification: objectId })
      .populate('createdBy', 'firstName lastName')
      .sort({ code: 1 });
  }

  async getAllCompetencies(filters?: any) {
    const query: any = {};

    if (filters?.qualification) query.qualification = filters.qualification;
    if (filters?.search) {
      query.$or = [
        { code: new RegExp(filters.search, 'i') },
        { title: new RegExp(filters.search, 'i') },
      ];
    }

    return await Competency.find(query)
      .populate('qualification', 'code title')
      .populate('createdBy', 'firstName lastName')
      .sort({ code: 1 });
  }

  async updateCompetency(competencyId: string, updateData: any) {
    return await Competency.findByIdAndUpdate(
      competencyId,
      updateData,
      { new: true, runValidators: true }
    ).populate('qualification');
  }

  async updateAssessmentCount(competencyId: string, increment: boolean = true) {
    const competency = await Competency.findById(competencyId);
    if (!competency) throw new Error('Competency not found');

    competency.totalAssessments = increment 
      ? competency.totalAssessments + 1 
      : Math.max(0, competency.totalAssessments - 1);

    return await competency.save();
  }

  async deleteCompetency(competencyId: string) {
    return await Competency.findByIdAndDelete(competencyId);
  }

  async getCompetenciesByIds(competencyIds: string[]) {
    return await Competency.find({ _id: { $in: competencyIds } });
  }
}

export default new CompetencyService();
