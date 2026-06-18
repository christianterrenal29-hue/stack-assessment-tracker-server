import Student from '../models/Student';
import { Assessment } from '../models/Assessment';

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
    const profile = await this.getStudentAssessmentProfile(studentId);

    riskScore += profile.absentNoShowCount * 30;
    riskScore += profile.notYetCompetentCount * 25;
    riskScore += profile.pendingResultCount * 15;
    riskScore += profile.incompleteChecklistCount * 10;

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
      .sort({ riskLevel: 1, updatedAt: -1 });
  }

  async getStudentRiskReport(studentId: string) {
    const student = await Student.findById(studentId)
      .populate('user', 'firstName lastName email')
      .populate('qualifications', 'code title');
    
    if (!student) throw new Error('Student not found');

    const user = student.user as unknown as PopulatedUser;

    const riskFactors = [];
    const recommendations = [];
    const profile = await this.getStudentAssessmentProfile(studentId);

    if (profile.absentNoShowCount > 0) {
      riskFactors.push({
        factor: 'Absent/No-show Candidates',
        current: profile.absentNoShowCount,
        threshold: 0,
        severity: 'high',
      });
      recommendations.push('Confirm candidate availability before the next assessment schedule');
    }

    if (profile.notYetCompetentCount > 0) {
      riskFactors.push({
        factor: 'Not Yet Competent Result',
        current: profile.notYetCompetentCount,
        threshold: 0,
        severity: 'high',
      });
      recommendations.push('Prepare reassessment or remediation plan');
    }

    if (profile.pendingResultCount > 0) {
      riskFactors.push({
        factor: 'Pending Assessment Result',
        current: profile.pendingResultCount,
        threshold: 0,
        severity: 'medium',
      });
      recommendations.push('Update pending candidate results');
    }

    if (profile.incompleteChecklistCount > 0) {
      riskFactors.push({
        factor: 'Incomplete TESDA Checklist',
        current: profile.incompleteChecklistCount,
        threshold: 0,
        severity: 'medium',
      });
      recommendations.push('Complete missing TESDA requirements and checklist documents');
    }

    return {
      studentId,
      studentName: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim(),
      email: user.email ?? '',
      riskLevel: student.riskLevel,
      assessmentAttendance: profile.assessmentAttendance,
      pendingResultCount: profile.pendingResultCount,
      notYetCompetentCount: profile.notYetCompetentCount,
      incompleteChecklistCount: profile.incompleteChecklistCount,
      riskFactors,
      recommendations,
      lastUpdated: student.updatedAt,
    };
  }

  async getAttendanceStats(studentId: string) {
    const profile = await this.getStudentAssessmentProfile(studentId);

    return {
      total: profile.totalCandidateRecords,
      present: profile.presentCount,
      absent: profile.absentNoShowCount,
      pending: profile.pendingAttendanceCount,
      percentage: profile.assessmentAttendance,
    };
  }

  async generateRiskAnalytics() {
    const assessments = await Assessment.find();
    const candidates = assessments.flatMap((assessment) => assessment.candidates);

    return {
      totalSchedules: assessments.length,
      totalCandidateRecords: candidates.length,
      absentNoShowCandidates: candidates.filter((candidate) => ['absent', 'no-show'].includes(candidate.attendanceStatus)).length,
      pendingAttendance: candidates.filter((candidate) => candidate.attendanceStatus === 'pending').length,
      pendingResults: candidates.filter((candidate) => candidate.result === 'pending').length,
      notYetCompetentResults: candidates.filter((candidate) => candidate.result === 'not_yet_competent').length,
      incompleteChecklists: assessments.filter((assessment) => !this.hasCompleteChecklist(assessment)).length,
      missingTesdaRequirements: assessments.filter((assessment) => !this.hasCoreRequirements(assessment)).length,
    };
  }

  async getRecommendationsForStudent(studentId: string): Promise<string[]> {
    const student = await Student.findById(studentId);
    if (!student) throw new Error('Student not found');

    const recommendations: string[] = [];

    const profile = await this.getStudentAssessmentProfile(studentId);

    if (profile.absentNoShowCount > 0) {
      recommendations.push('Confirm candidate attendance and reschedule absent/no-show candidates if needed');
    }

    if (profile.pendingResultCount > 0) {
      recommendations.push('Update pending candidate assessment results');
    }

    if (profile.notYetCompetentCount > 0) {
      recommendations.push('Prepare remediation and reassessment for Not Yet Competent candidates');
    }

    if (profile.incompleteChecklistCount > 0) {
      recommendations.push('Complete missing TESDA requirements and checklist documents');
    }

    if (student.riskLevel === 'high') {
      recommendations.push('Schedule meeting with student to discuss support options');
      recommendations.push('Develop recovery plan with clear milestones');
      recommendations.push('Increase monitoring and communication frequency');
    }

    return recommendations;
  }

  private async getStudentAssessmentProfile(studentId: string) {
    const assessments = await Assessment.find({ 'candidates.student': studentId });
    const candidateRecords = assessments.flatMap((assessment) =>
      assessment.candidates
        .filter((candidate) => String(candidate.student) === studentId)
        .map((candidate) => ({ assessment, candidate }))
    );

    const presentCount = candidateRecords.filter(({ candidate }) => candidate.attendanceStatus === 'present').length;
    const absentNoShowCount = candidateRecords.filter(({ candidate }) => ['absent', 'no-show'].includes(candidate.attendanceStatus)).length;
    const pendingAttendanceCount = candidateRecords.filter(({ candidate }) => candidate.attendanceStatus === 'pending').length;
    const pendingResultCount = candidateRecords.filter(({ candidate }) => candidate.result === 'pending').length;
    const notYetCompetentCount = candidateRecords.filter(({ candidate }) => candidate.result === 'not_yet_competent').length;
    const incompleteChecklistCount = candidateRecords.filter(({ assessment }) => !this.hasCompleteChecklist(assessment)).length;
    const totalCandidateRecords = candidateRecords.length;

    return {
      totalCandidateRecords,
      presentCount,
      absentNoShowCount,
      pendingAttendanceCount,
      pendingResultCount,
      notYetCompetentCount,
      incompleteChecklistCount,
      assessmentAttendance: totalCandidateRecords > 0
        ? ((presentCount / totalCandidateRecords) * 100).toFixed(2)
        : 0,
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

export default new RiskMonitoringService();
