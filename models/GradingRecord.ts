import mongoose, { Schema, Document } from 'mongoose';

export interface IRubricScore {
  criterion: string;
  score: number;
  feedback: string;
}

export interface IGrade {
  questionId: mongoose.Types.ObjectId;
  score: number;
  rubricScores: IRubricScore[];
  feedback: string;
}

export interface IGradingRecord extends Document {
  submission: mongoose.Types.ObjectId;
  gradedBy: mongoose.Types.ObjectId;
  grades: IGrade[];
  totalScore: number;
  totalPoints: number;
  percentage: number;
  overallFeedback: string;
  gradedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const rubricScoreSchema = new Schema<IRubricScore>({
  criterion: String,
  score: Number,
  feedback: String,
}, { _id: false });

const gradeSchema = new Schema<IGrade>({
  questionId: { type: Schema.Types.ObjectId, required: true },
  score: { type: Number, required: true },
  rubricScores: [rubricScoreSchema],
  feedback: String,
}, { _id: false });

const gradingRecordSchema = new Schema<IGradingRecord>(
  {
    submission: { type: Schema.Types.ObjectId, ref: 'Submission', required: true },
    gradedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    grades: [gradeSchema],
    totalScore: Number,
    totalPoints: Number,
    percentage: Number,
    overallFeedback: String,
    gradedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const GradingRecord = mongoose.model<IGradingRecord>('GradingRecord', gradingRecordSchema);
