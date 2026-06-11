import mongoose, { Schema, Document } from 'mongoose';

export interface IQuestion extends Document {
  assessment: mongoose.Types.ObjectId;
  text: string;
  type: 'mcq' | 'short-answer' | 'essay' | 'file-upload';
  points: number;
  options?: string[];
  correctAnswer?: string;
  rubric?: mongoose.Types.ObjectId;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const questionSchema = new Schema<IQuestion>(
  {
    assessment: { type: Schema.Types.ObjectId, ref: 'Assessment', required: true, index: true },
    text: { type: String, required: true },
    type: { type: String, enum: ['mcq', 'short-answer', 'essay', 'file-upload'], required: true },
    points: { type: Number, required: true, default: 1 },
    options: [String],
    correctAnswer: String,
    rubric: { type: Schema.Types.ObjectId, ref: 'Rubric' },
    order: { type: Number, required: true, default: 1 },
  },
  { timestamps: true }
);

export const Question = mongoose.model<IQuestion>('Question', questionSchema);
