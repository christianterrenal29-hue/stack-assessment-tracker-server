import { Schema, model, Document, Types } from 'mongoose';

export interface IStudent extends Document {
  user: Types.ObjectId;
  studentId: string;
  enrollmentDate: Date;
  status: 'active' | 'inactive' | 'graduated' | 'dropped';
  qualifications: Types.ObjectId[];
  currentCompetencies: Types.ObjectId[];
  completedCompetencies: Types.ObjectId[];
  attendancePercentage: number;
  totalOJTHours: number;
  requiredOJTHours: number;
  riskLevel: 'low' | 'medium' | 'high';
  lastAssessmentDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const studentSchema = new Schema<IStudent>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    studentId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    enrollmentDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'graduated', 'dropped'],
      default: 'active',
      index: true,
    },
    qualifications: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Qualification',
      },
    ],
    currentCompetencies: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Competency',
      },
    ],
    completedCompetencies: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Competency',
      },
    ],
    attendancePercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    totalOJTHours: {
      type: Number,
      default: 0,
      min: 0,
    },
    requiredOJTHours: {
      type: Number,
      default: 500,
      min: 0,
    },
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'low',
      index: true,
    },
    lastAssessmentDate: Date,
  },
  {
    timestamps: true,
  }
);

// Index for finding at-risk students
studentSchema.index({ riskLevel: 1, status: 1 });

export default model<IStudent>('Student', studentSchema);
