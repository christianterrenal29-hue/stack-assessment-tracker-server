import mongoose, { Schema, Document } from 'mongoose';

export interface INotificationDocument extends Document {
  recipient: mongoose.Types.ObjectId;
  type: 'risk_alert' | 'intervention' | 'achievement' | 'general' | 'upcoming_assessment' | 'missing_requirements' | 'result_posted' | 'schedule_updated';
  title: string;
  message: string;
  data?: Record<string, unknown>;
  read: boolean;
  actionUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotificationDocument>(
  {
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: ['risk_alert', 'intervention', 'achievement', 'general', 'upcoming_assessment', 'missing_requirements', 'result_posted', 'schedule_updated'],
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    data: { type: Schema.Types.Mixed },
    read: { type: Boolean, default: false, index: true },
    actionUrl: String,
  },
  { timestamps: true }
);

export default mongoose.model<INotificationDocument>('Notification', notificationSchema);
