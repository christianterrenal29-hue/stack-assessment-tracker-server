import mongoose, { Schema, Document } from 'mongoose';

export interface ISubjectPerformance {
  subject: string;
  averageScore: number;
  assessmentCount: number;
}

export interface IPerformanceMetrics {
  totalAssessments: number;
  submittedAssessments: number;
  averageScore: number;
  lowestScore: number;
  highestScore: number;
  submissionRate: number;
  onTimeSubmissions: number;
  lateSubmissions: number;
  gradeTrend: number[];
  riskLevel: 'low' | 'medium' | 'high';
  riskFactors: string[];
}

export interface IStudentPerformance extends Document {
  student: mongoose.Types.ObjectId;
  institution: mongoose.Types.ObjectId;
  department?: mongoose.Types.ObjectId;
  performanceMetrics: IPerformanceMetrics;
  subjectPerformance: ISubjectPerformance[];
  lastUpdated: Date;
  createdAt: Date;
}

const performanceMetricsSchema = new Schema<IPerformanceMetrics>({
  totalAssessments: { type: Number, default: 0 },
  submittedAssessments: { type: Number, default: 0 },
  averageScore: { type: Number, default: 0 },
  lowestScore: { type: Number, default: 0 },
  highestScore: { type: Number, default: 0 },
  submissionRate: { type: Number, default: 0 },
  onTimeSubmissions: { type: Number, default: 0 },
  lateSubmissions: { type: Number, default: 0 },
  gradeTrend: [Number],
  riskLevel: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
  riskFactors: [String],
}, { _id: false });

const subjectPerformanceSchema = new Schema<ISubjectPerformance>({
  subject: String,
  averageScore: { type: Number, default: 0 },
  assessmentCount: { type: Number, default: 0 },
}, { _id: false });

const studentPerformanceSchema = new Schema<IStudentPerformance>(
  {
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    institution: { type: Schema.Types.ObjectId, ref: 'Institution', required: true },
    department: { type: Schema.Types.ObjectId, ref: 'Department' },
    performanceMetrics: performanceMetricsSchema,
    subjectPerformance: [subjectPerformanceSchema],
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const StudentPerformance = mongoose.model<IStudentPerformance>(
  'StudentPerformance',
  studentPerformanceSchema
);
