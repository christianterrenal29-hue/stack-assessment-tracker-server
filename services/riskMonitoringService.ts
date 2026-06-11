import Student from '../models/Student';
import Attendance from '../models/Attendance';
import OJT from '../models/OJT';

type PopulatedUser = {
  firstName?: string;
  lastName?: string;
  email?: string;
};

export class RiskMonitoringService {
  async calculateStudentRiskLevel(studentId: string): Promise<'low' | 'medium' | 'high'> {
    const student = await Student.findById(studentId);
    if (!student) throw new Error('Student not found');

    let riskScore = 0;
    const riskFactors = [];

    // Check attendance (Low attendance = high risk)
    if (student.attendancePercentage < 75) {
      riskScore += 30;
      riskFactors.push('Low attendance');
    } else if (student.attendancePercentage < 85) {
      riskScore += 15;
      riskFactors.push('Moderate attendance');
    }

    // Check OJT hours (Insufficient OJT = high risk)
    const ojtCompletion = (student.totalOJTHours / student.requiredOJTHours) * 100;
    if (ojtCompletion < 50) {
      riskScore += 30;
      riskFactors.push('Insufficient OJT hours');
    } else if (ojtCompletion < 75) {
      riskScore += 15;
      riskFactors.push('Low OJT progress');
    }

    // Check competency completion
    const competencyCompletion = 
      student.completedCompetencies.length / 
      (student.completedCompetencies.length + student.currentCompetencies.length || 1) * 100;
    
    if (competencyCompletion < 50) {
      riskScore += 25;
      riskFactors.push('Incomplete competencies');
    } else if (competencyCompletion < 75) {
      riskScore += 10;
      riskFactors.push('Low competency progress');
    }

    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    if (riskScore >= 60) {
      riskLevel = 'high';
    } else if (riskScore >= 30) {
      riskLevel = 'medium';
    }

    // Update student risk level
    await Student.findByIdAndUpdate(studentId, { riskLevel }, { new: true });

    return riskLevel;
  }

  async getAtRiskStudents(threshold: 'high' | 'medium' | 'all' = 'high') {
    let query: any = {};
    
    if (threshold === 'high') {
      query.riskLevel = 'high';
    } else if (threshold === 'medium') {
      query.riskLevel = { $in: ['medium', 'high'] };
    }

    return await Student.find(query)
      .populate('user', 'firstName lastName email')
      .populate('qualifications')
      .sort({ riskLevel: 1, attendancePercentage: 1 });
  }

  async getStudentRiskReport(studentId: string) {
    const student = await Student.findById(studentId)
      .populate('user', 'firstName lastName email')
      .populate('qualifications', 'code title');
    
    if (!student) throw new Error('Student not found');

    const ojt = await OJT.findOne({ student: studentId });
    const attendanceStats = await this.getAttendanceStats(studentId);
    const user = student.user as unknown as PopulatedUser;

    const riskFactors = [];
    const recommendations = [];

    // Analyze risk factors
    if (student.attendancePercentage < 75) {
      riskFactors.push({
        factor: 'Low Attendance',
        current: `${student.attendancePercentage}%`,
        threshold: '75%',
        severity: 'high',
      });
      recommendations.push('Improve attendance - speak with counselor');
    }

    const ojtCompletion = ojt ? (ojt.hoursCompleted / ojt.requiredHours) * 100 : 0;
    if (ojtCompletion < 50) {
      riskFactors.push({
        factor: 'Insufficient OJT Hours',
        current: `${ojt?.hoursCompleted || 0} hours`,
        threshold: `${ojt?.requiredHours || 500} hours`,
        severity: 'high',
      });
      recommendations.push('Accelerate OJT work - complete more hours');
    }

    if (student.completedCompetencies.length === 0) {
      riskFactors.push({
        factor: 'No Completed Competencies',
        current: '0',
        threshold: '> 0',
        severity: 'high',
      });
      recommendations.push('Start competency assessments immediately');
    }

    return {
      studentId,
      studentName: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim(),
      email: user.email ?? '',
      riskLevel: student.riskLevel,
      attendancePercentage: student.attendancePercentage,
      ojtCompletion: ojtCompletion,
      competenciesCompleted: student.completedCompetencies.length,
      totalCompetencies: student.completedCompetencies.length + student.currentCompetencies.length,
      riskFactors,
      recommendations,
      lastUpdated: student.updatedAt,
    };
  }

  async getAttendanceStats(studentId: string) {
    const records = await Attendance.find({ student: studentId });
    
    return {
      total: records.length,
      present: records.filter((r) => r.status === 'present').length,
      absent: records.filter((r) => r.status === 'absent').length,
      late: records.filter((r) => r.status === 'late').length,
      excused: records.filter((r) => r.status === 'excused').length,
      percentage: records.length > 0
        ? ((records.filter((r) => r.status === 'present' || r.status === 'late').length / records.length) * 100).toFixed(2)
        : 0,
    };
  }

  async generateRiskAnalytics() {
    const students = await Student.find();
    
    const analytics = {
      totalStudents: students.length,
      highRisk: students.filter((s) => s.riskLevel === 'high').length,
      mediumRisk: students.filter((s) => s.riskLevel === 'medium').length,
      lowRisk: students.filter((s) => s.riskLevel === 'low').length,
      averageAttendance: (
        students.reduce((sum, s) => sum + s.attendancePercentage, 0) / students.length
      ).toFixed(2),
      averageOJTCompletion: (
        students.reduce((sum, s) => sum + (s.totalOJTHours / s.requiredOJTHours), 0) / students.length * 100
      ).toFixed(2),
      studentsWithLowAttendance: students.filter((s) => s.attendancePercentage < 75).length,
      studentsWithInsufficientOJT: students.filter((s) => s.totalOJTHours < s.requiredOJTHours / 2).length,
      studentsWithNoCompetencies: students.filter((s) => s.completedCompetencies.length === 0).length,
    };

    return analytics;
  }

  async getRecommendationsForStudent(studentId: string): Promise<string[]> {
    const student = await Student.findById(studentId);
    if (!student) throw new Error('Student not found');

    const recommendations: string[] = [];

    if (student.attendancePercentage < 70) {
      recommendations.push('URGENT: Attendance is critical - must improve immediately');
      recommendations.push('Contact student to address attendance barriers');
      recommendations.push('Consider additional support or flexible scheduling');
    }

    if (student.totalOJTHours < student.requiredOJTHours * 0.5) {
      recommendations.push('URGENT: OJT progress is severely behind schedule');
      recommendations.push('Increase OJT hours to meet graduation requirements');
      recommendations.push('Review OJT placement and supervisor support');
    }

    if (student.completedCompetencies.length === 0) {
      recommendations.push('CRITICAL: Student has not completed any competencies');
      recommendations.push('Schedule competency assessments immediately');
      recommendations.push('Provide tutoring or remedial support if needed');
    } else if (student.currentCompetencies.length > student.completedCompetencies.length) {
      recommendations.push('Accelerate competency assessment completion');
      recommendations.push('Review student performance on assessments');
    }

    if (student.riskLevel === 'high') {
      recommendations.push('Schedule meeting with student to discuss support options');
      recommendations.push('Develop recovery plan with clear milestones');
      recommendations.push('Increase monitoring and communication frequency');
    }

    return recommendations;
  }
}

export default new RiskMonitoringService();
