import { Router, Response } from 'express';
import { authMiddleware, roleCheck, AuthRequest } from '../middleware/authMiddleware';
import notificationService from '../services/notificationService';

const router = Router();

// Get user notifications
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const unreadOnly = req.query.unread === 'true';
    const notifications = await notificationService.getUserNotifications(req.user?.userId!, unreadOnly);
    res.json(notifications);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get unread count
router.get('/unread/count', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const count = await notificationService.getUnreadCount(req.user?.userId!);
    res.json({ unreadCount: count });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Mark notification as read
router.put('/:id/read', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const notification = await notificationService.markAsRead(String(req.params.id));
    res.json(notification);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Mark all as read
router.put('/read/all', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await notificationService.markAllAsRead(req.user?.userId!);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Delete notification
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    await notificationService.deleteNotification(String(req.params.id));
    res.json({ message: 'Notification deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get notification analytics
router.get('/analytics/summary', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const analytics = await notificationService.getNotificationAnalytics(req.user?.userId);
    res.json(analytics);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
