import mongoose, { Schema, Document } from 'mongoose';

export interface IAssessment extends Document {
  title: string;
  description: string;
  type: 'formative' | 'summative' | 'diagnostic';
  subject: string;
  gradeLevel: string;
  createdBy: mongoose.Types.ObjectId;
  educator?: mongoose.Types.ObjectId;
  instructor?: mongoose.Types.ObjectId;
  student?: mongoose.Types.ObjectId;
  institution: mongoose.Types.ObjectId;
  department?: mongoose.Types.ObjectId;
  learningOutcomes: string[];
  questions: mongoose.Types.ObjectId[];
  totalPoints: number;
  duration?: number;
  score?: number;
  dueDate: Date;
  releaseDate: Date;
  publishedAt?: Date;
  status: 'draft' | 'published' | 'closed' | 'pending' | 'completed';
  canResubmit: boolean;
  maxSubmissions: number;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const assessmentSchema = new Schema<IAssessment>(
  {
    title: { type: String, required: true },
    description: String,
    type: { type: String, enum: ['formative', 'summative', 'diagnostic'], required: true },
    subject: String,
    gradeLevel: String,
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    educator: { type: Schema.Types.ObjectId, ref: 'User' },
    instructor: { type: Schema.Types.ObjectId, ref: 'User' },
    student: { type: Schema.Types.ObjectId, ref: 'Student' },
    institution: { type: Schema.Types.ObjectId, ref: 'Institution', required: true },
    department: { type: Schema.Types.ObjectId, ref: 'Department' },
    learningOutcomes: [String],
    questions: [{ type: Schema.Types.ObjectId, ref: 'Question' }],
    totalPoints: { type: Number, default: 0 },
    duration: Number,
    score: Number,
    dueDate: Date,
    releaseDate: Date,
    publishedAt: Date,
    status: { type: String, enum: ['draft', 'published', 'closed', 'pending', 'completed'], default: 'draft' },
    canResubmit: { type: Boolean, default: false },
    maxSubmissions: { type: Number, default: 1 },
    tags: [String],
  },
  { timestamps: true }
);

export const Assessment = mongoose.model<IAssessment>('Assessment', assessmentSchema);
