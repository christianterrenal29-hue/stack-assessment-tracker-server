import mongoose, { Schema, Document } from 'mongoose';

export interface IAssessmentDistribution extends Document {
  assessment: mongoose.Types.ObjectId;
  distributedTo: mongoose.Types.ObjectId[];
  distributedBy: mongoose.Types.ObjectId;
  class: string;
  distributedAt: Date;
  deadline: Date;
  reminderSent: boolean;
  status: 'pending' | 'in-progress' | 'submitted' | 'closed';
  createdAt: Date;
  updatedAt: Date;
}

const assessmentDistributionSchema = new Schema<IAssessmentDistribution>(
  {
    assessment: { type: Schema.Types.ObjectId, ref: 'Assessment', required: true },
    distributedTo: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    distributedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    class: String,
    distributedAt: { type: Date, default: Date.now },
    deadline: Date,
    reminderSent: { type: Boolean, default: false },
    status: { type: String, enum: ['pending', 'in-progress', 'submitted', 'closed'], default: 'pending' },
  },
  { timestamps: true }
);

export const AssessmentDistribution = mongoose.model<IAssessmentDistribution>(
  'AssessmentDistribution',
  assessmentDistributionSchema
);
