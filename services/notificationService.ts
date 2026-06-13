import Notification from '../models/Notification';
import { Types } from 'mongoose';

export interface INotification {
  recipient: string;
  type: 'risk_alert' | 'intervention' | 'achievement' | 'general';
  title: string;
  message: string;
  data?: Record<string, unknown>;
  read?: boolean;
  actionUrl?: string;
}

type HighRiskStudentAlert = {
  instructorId: string;
  name: string;
  absentNoShowCandidates?: number;
  pendingResults?: number;
  notYetCompetentResults?: number;
  studentId: string;
};

type NotificationTypeCount = {
  _id: string;
  count: number;
};

export class NotificationService {
  /**
   * Create a notification
   */
  async createNotification(notificationData: INotification) {
    const notification = new Notification({
      recipient: new Types.ObjectId(notificationData.recipient),
      type: notificationData.type,
      title: notificationData.title,
      message: notificationData.message,
      data: notificationData.data,
      read: false,
      actionUrl: notificationData.actionUrl,
    });

    return await notification.save();
  }

  /**
   * Send risk alert notification
   */
  async sendRiskAlert(userId: string, studentName: string, riskLevel: string, recommendations: string[]) {
    return await this.createNotification({
      recipient: userId,
      type: 'risk_alert',
      title: `Student At Risk: ${studentName}`,
      message: `${studentName} is now at ${riskLevel} risk level. Immediate intervention may be needed.`,
      data: {
        studentName,
        riskLevel,
        recommendations,
      },
      actionUrl: `/dashboard/students/${studentName}`,
    });
  }

  /**
   * Send intervention notification
   */
  async sendInterventionNotification(userId: string, studentName: string, actions: string[]) {
    return await this.createNotification({
      recipient: userId,
      type: 'intervention',
      title: `Action Required: ${studentName}`,
      message: `Please review the intervention plan for ${studentName}.`,
      data: {
        studentName,
        actions,
      },
      actionUrl: `/intervention/${studentName}`,
    });
  }

  /**
   * Send achievement notification
   */
  async sendAchievementNotification(userId: string, achievement: string, details: string) {
    return await this.createNotification({
      recipient: userId,
      type: 'achievement',
      title: `Achievement Unlocked: ${achievement}`,
      message: details,
      actionUrl: '/dashboard/achievements',
    });
  }

  /**
   * Get notifications for user
   */
  async getUserNotifications(userId: string, unreadOnly: boolean = false) {
    const query: any = { recipient: userId };
    if (unreadOnly) query.read = false;

    return await Notification.find(query).sort({ createdAt: -1 });
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: string) {
    return await Notification.countDocuments({
      recipient: userId,
      read: false,
    });
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string) {
    return await Notification.findByIdAndUpdate(
      notificationId,
      { read: true },
      { new: true }
    );
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string) {
    return await Notification.updateMany(
      { recipient: userId, read: false },
      { read: true }
    );
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string) {
    return await Notification.findByIdAndDelete(notificationId);
  }

  /**
   * Batch send risk alerts to instructors about their students
   */
  async sendRiskAlertsToInstructors(highRiskStudents: HighRiskStudentAlert[]) {
    const alerts = [];

    for (const student of highRiskStudents) {
      // Send to all instructors in the system (simplified - in production would filter by course)
      const notification = await this.createNotification({
        recipient: student.instructorId,
        type: 'risk_alert',
        title: `Critical: Student ${student.name} at High Risk`,
        message: `${student.name} needs assessment follow-up. Absent/no-show: ${student.absentNoShowCandidates ?? 0}, pending results: ${student.pendingResults ?? 0}, not yet competent: ${student.notYetCompetentResults ?? 0}.`,
        data: {
          studentId: student.studentId,
          riskLevel: 'high',
          absentNoShowCandidates: student.absentNoShowCandidates ?? 0,
          pendingResults: student.pendingResults ?? 0,
          notYetCompetentResults: student.notYetCompetentResults ?? 0,
        },
        actionUrl: `/dashboard/students/${student.studentId}`,
      });
      alerts.push(notification);
    }

    return alerts;
  }

  /**
   * Send bulk notifications
   */
  async sendBulkNotifications(notificationDataList: INotification[]) {
    const notifications = await Promise.all(
      notificationDataList.map((data) => this.createNotification(data))
    );
    return notifications;
  }

  /**
   * Get notification analytics
   */
  async getNotificationAnalytics(userId?: string) {
    const query: any = {};
    if (userId) query.recipient = userId;

    const total = await Notification.countDocuments(query);
    const unread = await Notification.countDocuments({ ...query, read: false });
    const byType = await Notification.aggregate<NotificationTypeCount>([
      { $match: query },
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]);

    return {
      total,
      unread,
      read: total - unread,
      byType: Object.fromEntries(byType.map((b) => [b._id, b.count])),
    };
  }

  /**
   * Cleanup old notifications (older than 30 days)
   */
  async cleanupOldNotifications(daysOld: number = 30) {
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);

    const result = await Notification.deleteMany({
      createdAt: { $lt: cutoffDate },
      read: true,
    });

    return result;
  }
}

export default new NotificationService();
