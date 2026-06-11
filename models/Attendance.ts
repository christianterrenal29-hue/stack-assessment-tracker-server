import { Schema, model, Document, Types } from 'mongoose';

export interface IAttendance extends Document {
  student: Types.ObjectId;
  date: Date;
  status: 'present' | 'absent' | 'late' | 'excused';
  hoursAttended: number;
  notes?: string;
  recordedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const attendanceSchema = new Schema<IAttendance>(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'late', 'excused'],
      required: true,
      index: true,
    },
    hoursAttended: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    notes: String,
    recordedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for finding attendance records by student and date range
attendanceSchema.index({ student: 1, date: -1 });

export default model<IAttendance>('Attendance', attendanceSchema);
