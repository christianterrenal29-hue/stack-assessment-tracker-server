import Student from '../models/Student';
import riskMonitoringService from './riskMonitoringService';

export class RiskAssessmentScheduler {
  /**
   * Runs periodic risk assessment for all students
   * Should be called on a schedule (e.g., daily via cron job)
   */
  async runBatchRiskAssessment() {
    try {
      const students = await Student.find({ status: 'active' });
      const results = {
        processed: 0,
        updated: 0,
        errors: 0,
        timestamp: new Date(),
      };

      for (const student of students) {
        try {
          const previousRiskLevel = student.riskLevel;
          const newRiskLevel = await riskMonitoringService.calculateStudentRiskLevel(student._id.toString());

          if (previousRiskLevel !== newRiskLevel) {
            results.updated++;
          }
          results.processed++;
        } catch (error) {
          console.error(`Error assessing student ${student._id}:`, error);
          results.errors++;
        }
      }

      return results;
    } catch (error) {
      console.error('Batch risk assessment failed:', error);
      throw error;
    }
  }

  /**
   * Gets students whose risk level has changed
   */
  async getChangedRiskStudents(timeframe: 'today' | 'week' | 'month' = 'today') {
    const now = new Date();
    let startDate = new Date();

    if (timeframe === 'today') {
      startDate.setHours(0, 0, 0, 0);
    } else if (timeframe === 'week') {
      startDate.setDate(now.getDate() - 7);
    } else if (timeframe === 'month') {
      startDate.setMonth(now.getMonth() - 1);
    }

    return await Student.find({
      updatedAt: { $gte: startDate },
      status: 'active',
    })
      .populate('user', 'firstName lastName email')
      .sort({ updatedAt: -1 });
  }

  /**
   * Identifies students who need immediate intervention
   */
  async getHighPriorityStudents() {
    const students = await Student.find({
      $or: [
        { riskLevel: 'high' },
        { attendancePercentage: { $lt: 60 } },
        { completedCompetencies: { $size: 0 } },
      ],
      status: 'active',
    })
      .populate('user', 'firstName lastName email')
      .populate('qualifications', 'code title');

    return students.map((student) => ({
      studentId: student._id,
      name: student.user ? `${(student.user as any).firstName} ${(student.user as any).lastName}` : 'Unknown',
      email: (student.user as any)?.email,
      riskLevel: student.riskLevel,
      attendance: student.attendancePercentage,
      competenciesCompleted: student.completedCompetencies.length,
      urgency: this.calculateUrgencyScore(student),
    }));
  }

  /**
   * Calculate urgency score (0-100)
   */
  private calculateUrgencyScore(student: any): number {
    let score = 0;

    // Risk level contribution (0-40)
    if (student.riskLevel === 'high') score += 40;
    else if (student.riskLevel === 'medium') score += 20;

    // Attendance contribution (0-30)
    const attendanceScore = Math.max(0, 30 - student.attendancePercentage / 3);
    score += attendanceScore;

    if (student.completedCompetencies.length === 0) score += 30;

    return Math.min(100, Math.round(score));
  }

  /**
   * Get performance trend for student
   */
  async getStudentTrend(studentId: string, days: number = 30) {
    const student = await Student.findById(studentId);
    if (!student) throw new Error('Student not found');

    const trend = {
      studentId,
      period: `Last ${days} days`,
      metrics: {
        attendancePercentage: student.attendancePercentage,
        competenciesCompleted: student.completedCompetencies.length,
        riskLevel: student.riskLevel,
      },
      lastUpdated: student.updatedAt,
    };

    return trend;
  }

  /**
   * Generate intervention plan for at-risk student
   */
  async generateInterventionPlan(studentId: string) {
    const student = await Student.findById(studentId).populate('user');
    if (!student) throw new Error('Student not found');

    const recommendations = await riskMonitoringService.getRecommendationsForStudent(studentId);

    const plan = {
      studentId,
      studentName: `${(student.user as any).firstName} ${(student.user as any).lastName}`,
      currentStatus: {
        riskLevel: student.riskLevel,
        attendance: student.attendancePercentage,
        competenciesCompleted: student.completedCompetencies.length,
      },
      recommendations,
      interventionActions: this.generateActions(student),
      followUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week
    };

    return plan;
  }

  /**
   * Generate specific intervention actions
   */
  private generateActions(student: any): string[] {
    const actions: string[] = [];

    if (student.riskLevel === 'high') {
      actions.push('Schedule immediate meeting with student');
      actions.push('Assign academic advisor for support');
      actions.push('Create written recovery agreement');
    }

    if (student.attendancePercentage < 75) {
      actions.push('Investigate attendance barriers');
      actions.push('Offer flexible scheduling options');
      actions.push('Provide transportation or childcare support if needed');
    }

    if (student.completedCompetencies.length === 0) {
      actions.push('Refer to tutoring program');
      actions.push('Provide one-on-one coaching');
      actions.push('Assess learning style and provide targeted support');
    }

    return actions;
  }

  /**
   * Get cohort analytics
   */
  async getCohortAnalytics(qualification?: string) {
    const query: any = { status: 'active' };
    if (qualification) query.qualifications = qualification;

    const students = await Student.find(query);

    const analytics = {
      totalStudents: students.length,
      riskBreakdown: {
        high: students.filter((s) => s.riskLevel === 'high').length,
        medium: students.filter((s) => s.riskLevel === 'medium').length,
        low: students.filter((s) => s.riskLevel === 'low').length,
      },
      averageAttendance: (students.reduce((sum, s) => sum + s.attendancePercentage, 0) / students.length).toFixed(2),
      studentNeedingIntervention: students.filter((s) => s.riskLevel !== 'low').length,
      successRate: ((students.filter((s) => s.riskLevel === 'low').length / students.length) * 100).toFixed(2),
    };

    return analytics;
  }

  /**
   * Export at-risk students report
   */
  async generateAtRiskReport() {
    const students = await Student.find({ riskLevel: { $in: ['high', 'medium'] } })
      .populate('user', 'firstName lastName email')
      .sort({ riskLevel: 1 });

    const report = {
      generatedDate: new Date(),
      totalAtRisk: students.length,
      byRiskLevel: {
        high: students.filter((s) => s.riskLevel === 'high').length,
        medium: students.filter((s) => s.riskLevel === 'medium').length,
      },
      students: students.map((s) => ({
        studentId: s._id,
        name: `${(s.user as any).firstName} ${(s.user as any).lastName}`,
        email: (s.user as any).email,
        riskLevel: s.riskLevel,
        attendance: s.attendancePercentage,
        competenciesCompleted: s.completedCompetencies.length,
      })),
    };

    return report;
  }
}

export default new RiskAssessmentScheduler();
