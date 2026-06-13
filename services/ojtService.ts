import OJT from '../models/OJT';

export class OJTService {
  async createOJT(ojtData: any) {
    const ojt = new OJT({
      student: ojtData.student,
      qualification: ojtData.qualification,
      company: ojtData.company,
      supervisor: ojtData.supervisor,
      supervisorContact: ojtData.supervisorContact,
      startDate: ojtData.startDate,
      status: ojtData.status || 'ongoing',
      requiredHours: ojtData.requiredHours || 500,
      hoursCompleted: ojtData.hoursCompleted || 0,
      monthlyReports: ojtData.monthlyReports || [],
    });

    return await ojt.save();
  }

  async getOJTById(ojtId: string) {
    return await OJT.findById(ojtId)
      .populate('student')
      .populate('qualification', 'code title');
  }

  async getStudentOJT(studentId: string) {
    return await OJT.findOne({ student: studentId })
      .populate('qualification', 'code title');
  }

  async getAllOJTRecords(filters?: any) {
    const query: any = {};

    if (filters?.student) query.student = filters.student;
    if (filters?.status) query.status = filters.status;
    if (filters?.qualification) query.qualification = filters.qualification;

    return await OJT.find(query)
      .populate('student')
      .populate('qualification', 'code title')
      .sort({ startDate: -1 });
  }

  async updateOJTRecord(ojtId: string, updateData: any) {
    return await OJT.findByIdAndUpdate(
      ojtId,
      updateData,
      { new: true, runValidators: true }
    ).populate('student').populate('qualification');
  }

  async updateOJTHours(ojtId: string, hoursCompleted: number) {
    const ojt = await OJT.findById(ojtId);
    if (!ojt) throw new Error('OJT record not found');

    ojt.hoursCompleted = hoursCompleted;
    ojt.totalHours = hoursCompleted;

    return await ojt.save();
  }

  async addMonthlyReport(ojtId: string, reportData: any) {
    const ojt = await OJT.findById(ojtId);
    if (!ojt) throw new Error('OJT record not found');

    ojt.monthlyReports.push({
      month: reportData.month,
      hoursWorked: reportData.hoursWorked,
      skillsDeveloped: reportData.skillsDeveloped || [],
      supervisorComment: reportData.supervisorComment,
    });

    return await ojt.save();
  }

  async completeOJT(ojtId: string, finalReport?: string) {
    return await OJT.findByIdAndUpdate(
      ojtId,
      {
        status: 'completed',
        endDate: new Date(),
        finalReport,
      },
      { new: true, runValidators: true }
    ).populate('student').populate('qualification');
  }

  async getOJTProgress(ojtId: string) {
    const ojt = await OJT.findById(ojtId);
    if (!ojt) throw new Error('OJT record not found');

    const progress = (ojt.hoursCompleted / ojt.requiredHours) * 100;

    return {
      ojtId,
      hoursCompleted: ojt.hoursCompleted,
      requiredHours: ojt.requiredHours,
      progressPercentage: Math.min(progress, 100),
      status: ojt.status,
      monthsReporting: ojt.monthlyReports.length,
    };
  }

  async deleteOJTRecord(ojtId: string) {
    return await OJT.findByIdAndDelete(ojtId);
  }

  async getStudentsWithInsufficientOJT(threshold: number = 250) {
    return await OJT.find({
      hoursCompleted: { $lt: threshold },
    }).populate('student');
  }

  async getOJTCompletionRate(studentId: string) {
    const ojt = await OJT.findOne({ student: studentId });
    if (!ojt) return null;

    return {
      completed: ojt.hoursCompleted,
      required: ojt.requiredHours,
      percentage: (ojt.hoursCompleted / ojt.requiredHours) * 100,
    };
  }
}

export default new OJTService();
