import { Schema, model, Document } from 'mongoose';

export interface ICourse extends Document {
  code: string;
  title: string;
  description: string;
  department: Schema.Types.ObjectId;
  instructor: Schema.Types.ObjectId;
  qualification: Schema.Types.ObjectId;
  startDate: Date;
  endDate: Date;
  schedule: string;
  maxStudents: number;
  enrolledStudents: Schema.Types.ObjectId[];
  status: 'active' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

const courseSchema = new Schema<ICourse>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    department: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
      index: true,
    },
    instructor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    qualification: {
      type: Schema.Types.ObjectId,
      ref: 'Qualification',
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    schedule: {
      type: String,
      required: true,
    },
    maxStudents: {
      type: Number,
      required: true,
      default: 30,
      min: 1,
    },
    enrolledStudents: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Student',
      },
    ],
    status: {
      type: String,
      enum: ['active', 'completed', 'cancelled'],
      default: 'active',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export default model<ICourse>('Course', courseSchema);
