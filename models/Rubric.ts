import mongoose, { Schema, Document } from 'mongoose';

export interface ILevel {
  level: string;
  points: number;
  description: string;
}

export interface ICriterion {
  _id?: mongoose.Types.ObjectId;
  criterion: string;
  description: string;
  maxPoints: number;
  levels: ILevel[];
}

export interface IRubric extends Document {
  name: string;
  description: string;
  assessment?: mongoose.Types.ObjectId;
  educator?: mongoose.Types.ObjectId;
  createdBy?: mongoose.Types.ObjectId;
  institution?: mongoose.Types.ObjectId;
  criteria: ICriterion[];
  totalPoints: number;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const levelSchema = new Schema<ILevel>({
  level: { type: String, required: true },
  points: { type: Number, required: true },
  description: String,
}, { _id: false });

const criterionSchema = new Schema<ICriterion>({
  criterion: { type: String, required: true },
  description: String,
  maxPoints: { type: Number, required: true },
  levels: [levelSchema],
}, { _id: true });

const rubricSchema = new Schema<IRubric>(
  {
    name: { type: String, required: true },
    description: String,
    assessment: { type: Schema.Types.ObjectId, ref: 'Assessment', index: true },
    educator: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    institution: { type: Schema.Types.ObjectId, ref: 'Institution' },
    criteria: [criterionSchema],
    totalPoints: { type: Number, default: 0 },
    isPublic: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Rubric = mongoose.model<IRubric>('Rubric', rubricSchema);
