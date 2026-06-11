import { Schema, model, Document, Types } from 'mongoose';

export interface IOJT extends Document {
  student: Types.ObjectId;
  qualification: Types.ObjectId;
  company: string;
  supervisor: string;
  supervisorContact: string;
  startDate: Date;
  endDate?: Date;
  status: 'ongoing' | 'completed' | 'suspended' | 'cancelled';
  totalHours: number;
  requiredHours: number;
  hoursCompleted: number;
  monthlyReports: Array<{
    month: string;
    hoursWorked: number;
    skillsDeveloped: string[];
    supervisorComment?: string;
  }>;
  finalReport?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ojtSchema = new Schema<IOJT>(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    qualification: {
      type: Schema.Types.ObjectId,
      ref: 'Qualification',
      required: true,
      index: true,
    },
    company: {
      type: String,
      required: true,
      index: true,
    },
    supervisor: {
      type: String,
      required: true,
    },
    supervisorContact: {
      type: String,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: Date,
    status: {
      type: String,
      enum: ['ongoing', 'completed', 'suspended', 'cancelled'],
      default: 'ongoing',
      index: true,
    },
    totalHours: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    requiredHours: {
      type: Number,
      required: true,
      default: 500,
      min: 0,
    },
    hoursCompleted: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    monthlyReports: [
      {
        month: String,
        hoursWorked: Number,
        skillsDeveloped: [String],
        supervisorComment: String,
      },
    ],
    finalReport: String,
  },
  {
    timestamps: true,
  }
);

// Index for finding OJT records by student
ojtSchema.index({ student: 1, status: 1 });

export default model<IOJT>('OJT', ojtSchema);
