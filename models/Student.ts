import { Schema, model, Document, Types } from 'mongoose';

export const COURSE_OPTIONS = ['IT', 'HRMT', 'ECT', 'HST'] as const;
export const YEAR_LEVEL_OPTIONS = ['1st Year', '2nd Year', '3rd Year'] as const;

export type CourseOption = (typeof COURSE_OPTIONS)[number];
export type YearLevelOption = (typeof YEAR_LEVEL_OPTIONS)[number];

export interface IStudent extends Document {
  user: Types.ObjectId;
  studentId: string;
  course: CourseOption;
  yearLevel: YearLevelOption;
  enrollmentDate: Date;
  status: 'active' | 'inactive' | 'graduated' | 'dropped';
  qualifications: Types.ObjectId[];
  currentCompetencies: Types.ObjectId[];
  completedCompetencies: Types.ObjectId[];
  attendancePercentage: number;
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
    course: {
      type: String,
      enum: COURSE_OPTIONS,
      required: true,
      index: true,
    },
    yearLevel: {
      type: String,
      enum: YEAR_LEVEL_OPTIONS,
      required: true,
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

studentSchema.index({ riskLevel: 1, status: 1 });
studentSchema.index({ course: 1, yearLevel: 1, status: 1 });

export default model<IStudent>('Student', studentSchema);
