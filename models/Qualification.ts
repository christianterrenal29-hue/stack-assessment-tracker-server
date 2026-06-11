import { Schema, model, Document } from 'mongoose';

export interface IQualification extends Document {
  code: string;
  title: string;
  description: string;
  competencies: Schema.Types.ObjectId[];
  requiredOJTHours: number;
  minimumAttendance: number;
  createdBy: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const qualificationSchema = new Schema<IQualification>(
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
    competencies: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Competency',
        required: true,
      },
    ],
    requiredOJTHours: {
      type: Number,
      required: true,
      default: 500,
      min: 0,
    },
    minimumAttendance: {
      type: Number,
      required: true,
      default: 80,
      min: 0,
      max: 100,
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

export default model<IQualification>('Qualification', qualificationSchema);
