import mongoose, { Schema, Document } from 'mongoose';

export interface IAnswer {
  questionId: mongoose.Types.ObjectId;
  answerType: 'mcq' | 'short-answer' | 'essay' | 'file-upload';
  answer: string | mongoose.Types.ObjectId;
  submittedAt: Date;
}

export interface ISubmission extends Document {
  assessment: mongoose.Types.ObjectId;
  student: mongoose.Types.ObjectId;
  distributedAssessment: mongoose.Types.ObjectId;
  answers: IAnswer[];
  submittedAt: Date;
  submissionNumber: number;
  status: 'draft' | 'submitted' | 'graded';
  markedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const answerSchema = new Schema<IAnswer>({
  questionId: { type: Schema.Types.ObjectId, required: true },
  answerType: { type: String, enum: ['mcq', 'short-answer', 'essay', 'file-upload'], required: true },
  answer: { type: Schema.Types.Mixed, required: true },
  submittedAt: { type: Date, default: Date.now },
}, { _id: false });

const submissionSchema = new Schema<ISubmission>(
  {
    assessment: { type: Schema.Types.ObjectId, ref: 'Assessment', required: true },
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    distributedAssessment: { type: Schema.Types.ObjectId, ref: 'AssessmentDistribution' },
    answers: [answerSchema],
    submittedAt: Date,
    submissionNumber: { type: Number, default: 1 },
    status: { type: String, enum: ['draft', 'submitted', 'graded'], default: 'draft' },
    markedAt: Date,
  },
  { timestamps: true }
);

export const Submission = mongoose.model<ISubmission>('Submission', submissionSchema);
