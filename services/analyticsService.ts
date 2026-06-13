import Student from '../models/Student';
import { Assessment } from '../models/Assessment';

export class AnalyticsService {
  /**
   * Get comprehensive dashboard analytics
   */
  async getDashboardAnalytics() {
    const [
      totalStudents,
      activeStudents,
      attendanceData,
      assessmentData,
    ] = await Promise.all([
      Student.countDocuments(),
      Student.countDocuments({ status: 'active' }),
      this.getAttendanceAnalytics(),
      this.getAssessmentAnalytics(),
    ]);

    return {
      students: {
        total: totalStudents,
        active: activeStudents,
      },
      assessmentRisk: await this.getRiskFactorAnalysis(),
      attendance: attendanceData,
      assessment: assessmentData,
    };
  }

  /**
   * Get attendance analytics
   */
  async getAttendanceAnalytics() {
    const assessments = await Assessment.find();
    const candidates = assessments.flatMap((assessment) => assessment.candidates);
    const totalRecords = candidates.length;
    const presentRecords = candidates.filter((candidate) => candidate.attendanceStatus === 'present').length;
    const absentRecords = candidates.filter((candidate) => candidate.attendanceStatus === 'absent').length;
    const pendingRecords = candidates.filter((candidate) => candidate.attendanceStatus === 'pending').length;

    return {
      totalRecords,
      breakdown: {
        present: presentRecords,
        absent: absentRecords,
        pending: pendingRecords,
      },
      assessmentAttendanceRate: totalRecords > 0 ? ((presentRecords / totalRecords) * 100).toFixed(2) : '0.00',
      absentNoShowCandidates: absentRecords,
      pendingAssessmentAttendance: pendingRecords,
    };
  }

  /**
   * Get assessment analytics
   */
  async getAssessmentAnalytics() {
    const assessments = await Assessment.find();

    const totalAssessments = assessments.length;
    const completedAssessments = assessments.filter((a) => a.status === 'completed').length;
    const pendingAssessments = assessments.filter((a) => a.status === 'scheduled' || a.status === 'ongoing').length;

    const candidates = assessments.flatMap((a) => a.candidates);
    const avgScore = candidates.length > 0
      ? ((candidates.filter((candidate) => candidate.result === 'competent').length / candidates.length) * 100).toFixed(2)
      : 0;

    const passRate = candidates.length > 0
      ? (candidates.filter((candidate) => candidate.result === 'competent').length / candidates.length * 100).toFixed(2)
      : 0;

    return {
      total: totalAssessments,
      completed: completedAssessments,
      pending: pendingAssessments,
      absentNoShowCandidates: candidates.filter((candidate) => candidate.attendanceStatus === 'absent').length,
      pendingResults: candidates.filter((candidate) => candidate.result === 'pending').length,
      notYetCompetentResults: candidates.filter((candidate) => candidate.result === 'not_yet_competent').length,
      incompleteChecklists: assessments.filter((assessment) => !this.hasCompleteChecklist(assessment)).length,
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

    const assessments = await Assessment.find({ scheduleDateTime: { $gte: startDate } }).lean();
    const attendanceByDay = assessments
      .reduce<Record<string, { date: string; count: number; present: number; absent: number; pending: number }>>((days, assessment) => {
        const date = new Date(assessment.scheduleDateTime).toISOString().slice(0, 10);
        const current = days[date] ?? { date, count: 0, present: 0, absent: 0, pending: 0 };
        assessment.candidates.forEach((candidate) => {
          current.count++;
          current[candidate.attendanceStatus]++;
        });
        days[date] = current;
        return days;
      }, {});

    return {
      period: `Last ${days} days`,
      data: Object.values(attendanceByDay).sort((a, b) => a.date.localeCompare(b.date)),
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
    const assessments = await Assessment.find();
    const candidates = assessments.flatMap((assessment) => assessment.candidates);

    return {
      absentNoShowCandidates: candidates.filter((candidate) => candidate.attendanceStatus === 'absent').length,
      pendingResults: candidates.filter((candidate) => candidate.result === 'pending').length,
      notYetCompetentResults: candidates.filter((candidate) => candidate.result === 'not_yet_competent').length,
      pendingAssessments: assessments.filter((assessment) => ['scheduled', 'ongoing'].includes(assessment.status)).length,
      incompleteChecklists: assessments.filter((assessment) => !this.hasCompleteChecklist(assessment)).length,
      missingTesdaRequirements: assessments.filter((assessment) => !this.hasCoreRequirements(assessment)).length,
    };
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
    const assessments = await Assessment.find({ createdBy: instructorId });

    const studentsAssessed = new Set(
      assessments
        .flatMap((a) => a.candidates.map((candidate) => candidate.student.toString()))
        .filter((studentId): studentId is string => Boolean(studentId))
    ).size;
    const avgScore = assessments.length > 0
      ? ((assessments.flatMap((a) => a.candidates).filter((candidate) => candidate.result === 'competent').length / Math.max(assessments.flatMap((a) => a.candidates).length, 1)) * 100).toFixed(2)
      : 0;

    const passRate = assessments.length > 0
      ? (assessments.flatMap((a) => a.candidates).filter((candidate) => candidate.result === 'competent').length / Math.max(assessments.flatMap((a) => a.candidates).length, 1) * 100).toFixed(2)
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
    const assessments = await Assessment.find();
    const total = assessments.length || 1;

    const complianceMetrics = {
      total: assessments.length,
      coreRequirementsComplete: assessments.filter((assessment) => this.hasCoreRequirements(assessment)).length,
      attendanceSheetsVerified: assessments.filter((assessment) => assessment.checklist?.attendanceSheetStatus === 'verified').length,
      ratingSheetsVerified: assessments.filter((assessment) => assessment.checklist?.carsRatingSheetStatus === 'verified').length,
      fullyCompliant: assessments.filter((assessment) => this.hasCompleteChecklist(assessment)).length,
    };

    return {
      ...complianceMetrics,
      coreRequirementRate: ((complianceMetrics.coreRequirementsComplete / total) * 100).toFixed(2),
      attendanceSheetRate: ((complianceMetrics.attendanceSheetsVerified / total) * 100).toFixed(2),
      ratingSheetRate: ((complianceMetrics.ratingSheetsVerified / total) * 100).toFixed(2),
      overallCompliance: ((complianceMetrics.fullyCompliant / total) * 100).toFixed(2),
    };
  }

  private hasCoreRequirements(assessment: any) {
    return Boolean(
      assessment.checklist?.applicationFormSubmitted &&
      assessment.checklist?.selfAssessmentGuideSubmitted &&
      assessment.checklist?.passportPhotosSubmitted &&
      assessment.checklist?.assessmentFeeOrAdmissionSlip
    );
  }

  private hasCompleteChecklist(assessment: any) {
    return Boolean(
      this.hasCoreRequirements(assessment) &&
      assessment.checklist?.attendanceSheetStatus === 'verified' &&
      assessment.checklist?.carsRatingSheetStatus === 'verified'
    );
  }
}

export default new AnalyticsService();
