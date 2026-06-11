import { Schema, model, Document, Types } from 'mongoose';

export interface ICompetency extends Document {
  code: string;
  title: string;
  description: string;
  qualification: Types.ObjectId;
  assessmentCriteria: string[];
  passingScore: number;
  totalAssessments: number;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const competencySchema = new Schema<ICompetency>(
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
    qualification: {
      type: Schema.Types.ObjectId,
      ref: 'Qualification',
      required: true,
      index: true,
    },
    assessmentCriteria: [
      {
        type: String,
        required: true,
      },
    ],
    passingScore: {
      type: Number,
      required: true,
      default: 75,
      min: 0,
      max: 100,
    },
    totalAssessments: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default model<ICompetency>('Competency', competencySchema);
