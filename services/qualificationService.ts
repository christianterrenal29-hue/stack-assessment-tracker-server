import Qualification from '../models/Qualification';

export class QualificationService {
  async createQualification(qualificationData: any, createdBy: string) {
    const qualification = new Qualification({
      code: qualificationData.code,
      title: qualificationData.title,
      description: qualificationData.description,
      competencies: qualificationData.competencies || [],
      requiredOJTHours: qualificationData.requiredOJTHours || 500,
      minimumAttendance: qualificationData.minimumAttendance || 80,
      createdBy,
    });

    return await qualification.save();
  }

  async getQualificationById(qualificationId: string) {
    return await Qualification.findById(qualificationId)
      .populate('competencies', 'code title')
      .populate('createdBy', 'firstName lastName');
  }

  async getAllQualifications(filters?: any) {
    const query: any = {};

    if (filters?.search) {
      query.$or = [
        { code: new RegExp(filters.search, 'i') },
        { title: new RegExp(filters.search, 'i') },
      ];
    }

    return await Qualification.find(query)
      .populate('competencies', 'code title')
      .populate('createdBy', 'firstName lastName')
      .sort({ code: 1 });
  }

  async updateQualification(qualificationId: string, updateData: any) {
    return await Qualification.findByIdAndUpdate(
      qualificationId,
      updateData,
      { new: true, runValidators: true }
    ).populate('competencies').populate('createdBy');
  }

  async addCompetency(qualificationId: string, competencyId: string) {
    const qualification = await Qualification.findById(qualificationId);
    if (!qualification) throw new Error('Qualification not found');

    if (!qualification.competencies.includes(competencyId as any)) {
      qualification.competencies.push(competencyId as any);
      await qualification.save();
    }

    return qualification;
  }

  async removeCompetency(qualificationId: string, competencyId: string) {
    const qualification = await Qualification.findById(qualificationId);
    if (!qualification) throw new Error('Qualification not found');

    qualification.competencies = qualification.competencies.filter(
      (id) => id.toString() !== competencyId
    );

    return await qualification.save();
  }

  async deleteQualification(qualificationId: string) {
    return await Qualification.findByIdAndDelete(qualificationId);
  }

  async getCompetencyCountByQualification(qualificationId: string) {
    const qualification = await Qualification.findById(qualificationId);
    return qualification ? qualification.competencies.length : 0;
  }
}

export default new QualificationService();
