import Student from '../models/Student';
import Attendance from '../models/Attendance';
import { Assessment } from '../models/Assessment';
import OJT from '../models/OJT';

export class AnalyticsService {
  /**
   * Get comprehensive dashboard analytics
   */
  async getDashboardAnalytics() {
    const [
      totalStudents,
      activeStudents,
      highRiskCount,
      mediumRiskCount,
      lowRiskCount,
      attendanceData,
      ojtData,
      assessmentData,
    ] = await Promise.all([
      Student.countDocuments(),
      Student.countDocuments({ status: 'active' }),
      Student.countDocuments({ riskLevel: 'high' }),
      Student.countDocuments({ riskLevel: 'medium' }),
      Student.countDocuments({ riskLevel: 'low' }),
      this.getAttendanceAnalytics(),
      this.getOJTAnalytics(),
      this.getAssessmentAnalytics(),
    ]);

    return {
      students: {
        total: totalStudents,
        active: activeStudents,
      },
      riskMetrics: {
        high: highRiskCount,
        medium: mediumRiskCount,
        low: lowRiskCount,
        atRiskPercentage: ((highRiskCount + mediumRiskCount) / activeStudents * 100).toFixed(2),
      },
      attendance: attendanceData,
      ojt: ojtData,
      assessment: assessmentData,
    };
  }

  /**
   * Get attendance analytics
   */
  async getAttendanceAnalytics() {
    const students = await Student.find({ status: 'active' });

    const totalRecords = await Attendance.countDocuments();
    const presentRecords = await Attendance.countDocuments({ status: 'present' });
    const absentRecords = await Attendance.countDocuments({ status: 'absent' });
    const lateRecords = await Attendance.countDocuments({ status: 'late' });
    const excusedRecords = await Attendance.countDocuments({ status: 'excused' });

    const avgAttendance = (
      students.reduce((sum, s) => sum + s.attendancePercentage, 0) / students.length
    ).toFixed(2);

    const lowAttendanceCount = students.filter((s) => s.attendancePercentage < 75).length;

    return {
      totalRecords,
      breakdown: {
        present: presentRecords,
        absent: absentRecords,
        late: lateRecords,
        excused: excusedRecords,
      },
      averageAttendance: avgAttendance,
      lowAttendanceCount,
      attendanceAlerts: students
        .filter((s) => s.attendancePercentage < 70)
        .length,
    };
  }

  /**
   * Get OJT analytics
   */
  async getOJTAnalytics() {
    const ojtRecords = await OJT.find();

    const totalHoursRequired = ojtRecords.reduce((sum, o) => sum + o.requiredHours, 0);
    const totalHoursCompleted = ojtRecords.reduce((sum, o) => sum + o.hoursCompleted, 0);
    const completedCount = ojtRecords.filter((o) => o.status === 'completed').length;
    const ongoingCount = ojtRecords.filter((o) => o.status === 'ongoing').length;

    const completionRate = totalHoursRequired > 0 ? ((totalHoursCompleted / totalHoursRequired) * 100).toFixed(2) : 0;

    return {
      totalRecords: ojtRecords.length,
      totalHoursRequired,
      totalHoursCompleted,
      completionRate,
      status: {
        completed: completedCount,
        ongoing: ongoingCount,
      },
      monthlyReportsTotal: ojtRecords.reduce((sum, o) => sum + o.monthlyReports.length, 0),
    };
  }

  /**
   * Get assessment analytics
   */
  async getAssessmentAnalytics() {
    const assessments = await Assessment.find();

    const totalAssessments = assessments.length;
    const completedAssessments = assessments.filter((a) => a.status === 'completed').length;
    const pendingAssessments = assessments.filter((a) => a.status === 'pending').length;

    const avgScore = assessments.length > 0
      ? (assessments.reduce((sum, a) => sum + (a.score || 0), 0) / assessments.length).toFixed(2)
      : 0;

    const passRate = completedAssessments > 0
      ? (assessments.filter((a) => a.score! >= 75).length / completedAssessments * 100).toFixed(2)
      : 0;

    return {
      total: totalAssessments,
      completed: completedAssessments,
      pending: pendingAssessments,
      averageScore: avgScore,
      passRate,
    };
  }

  /**
   * Get student performance trends
   */
  async getStudentPerformanceTrends(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const attendanceByDay = await Attendance.aggregate([
      {
        $match: {
          date: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$date' },
          },
          count: { $sum: 1 },
          present: {
            $sum: {
              $cond: [{ $eq: ['$status', 'present'] }, 1, 0],
            },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return {
      period: `Last ${days} days`,
      data: attendanceByDay,
    };
  }

  /**
   * Get cohort progress report
   */
  async getCohortProgressReport(qualificationId?: string) {
    const query: any = { status: 'active' };
    if (qualificationId) {
      query.qualifications = qualificationId;
    }

    const students = await Student.find(query).populate('completedCompetencies');

    const competencyProgress = students.map((s) => {
      const totalCompetencies = s.completedCompetencies.length + s.currentCompetencies.length;
      const progressPercentage = totalCompetencies > 0
        ? (s.completedCompetencies.length / totalCompetencies * 100).toFixed(2)
        : 0;

      return {
        studentId: s._id,
        completedCompetencies: s.completedCompetencies.length,
        totalCompetencies,
        progressPercentage,
      };
    });

    const averageProgress = competencyProgress.length > 0
      ? (
        competencyProgress.reduce(
          (sum, cp) => sum + parseFloat(cp.progressPercentage as string),
          0
        ) / competencyProgress.length
      ).toFixed(2)
      : 0;

    return {
      totalStudents: students.length,
      averageCompetencyProgress: averageProgress,
      studentProgress: competencyProgress,
    };
  }

  /**
   * Get risk factor analysis
   */
  async getRiskFactorAnalysis() {
    const students = await Student.find({ status: 'active' });

    const riskFactors = {
      lowAttendance: 0,
      insufficientOJT: 0,
      noCompetencies: 0,
      multipleRiskFactors: 0,
    };

    students.forEach((student) => {
      let factorCount = 0;

      if (student.attendancePercentage < 75) {
        riskFactors.lowAttendance++;
        factorCount++;
      }

      if (student.totalOJTHours < student.requiredOJTHours / 2) {
        riskFactors.insufficientOJT++;
        factorCount++;
      }

      if (student.completedCompetencies.length === 0) {
        riskFactors.noCompetencies++;
        factorCount++;
      }

      if (factorCount > 1) {
        riskFactors.multipleRiskFactors++;
      }
    });

    return riskFactors;
  }

  /**
   * Get success metrics
   */
  async getSuccessMetrics() {
    const students = await Student.find();

    const graduated = students.filter((s) => s.status === 'graduated').length;
    const active = students.filter((s) => s.status === 'active').length;
    const dropped = students.filter((s) => s.status === 'dropped').length;

    const completedStudents = await Student.find({
      status: 'graduated',
    });

    const avgCompetenciesAtGraduation = completedStudents.length > 0
      ? (
        completedStudents.reduce((sum, s) => sum + s.completedCompetencies.length, 0) /
        completedStudents.length
      ).toFixed(2)
      : 0;

    return {
      graduated,
      active,
      dropped,
      retentionRate: ((active + graduated) / students.length * 100).toFixed(2),
      completionRate: (graduated / students.length * 100).toFixed(2),
      avgCompetenciesAtGraduation,
    };
  }

  /**
   * Get instructor effectiveness metrics
   */
  async getInstructorMetrics(instructorId: string) {
    const assessments = await Assessment.find({ instructor: instructorId });

    const studentsAssessed = new Set(
      assessments
        .map((a) => a.student?.toString())
        .filter((studentId): studentId is string => Boolean(studentId))
    ).size;
    const avgScore = assessments.length > 0
      ? (assessments.reduce((sum, a) => sum + (a.score || 0), 0) / assessments.length).toFixed(2)
      : 0;

    const passRate = assessments.length > 0
      ? (assessments.filter((a) => a.score! >= 75).length / assessments.length * 100).toFixed(2)
      : 0;

    return {
      assessmentsConducted: assessments.length,
      studentsAssessed,
      averageScore: avgScore,
      passRate,
    };
  }

  /**
   * Generate compliance report
   */
  async getComplianceReport() {
    const students = await Student.find({ status: 'active' });

    const complianceMetrics = {
      attendanceCompliant: 0,
      ojtCompliant: 0,
      competencyCompliant: 0,
      fullyCompliant: 0,
      total: students.length,
    };

    students.forEach((student) => {
      let compliant = 0;

      if (student.attendancePercentage >= 80) {
        complianceMetrics.attendanceCompliant++;
        compliant++;
      }

      if (student.totalOJTHours >= student.requiredOJTHours * 0.75) {
        complianceMetrics.ojtCompliant++;
        compliant++;
      }

      if (student.completedCompetencies.length > 0) {
        complianceMetrics.competencyCompliant++;
        compliant++;
      }

      if (compliant === 3) {
        complianceMetrics.fullyCompliant++;
      }
    });

    return {
      ...complianceMetrics,
      attendanceComplianceRate: ((complianceMetrics.attendanceCompliant / students.length) * 100).toFixed(2),
      ojtComplianceRate: ((complianceMetrics.ojtCompliant / students.length) * 100).toFixed(2),
      competencyComplianceRate: ((complianceMetrics.competencyCompliant / students.length) * 100).toFixed(2),
      overallCompliance: ((complianceMetrics.fullyCompliant / students.length) * 100).toFixed(2),
    };
  }
}

export default new AnalyticsService();
