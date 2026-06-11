import mongoose, { Schema, Document } from 'mongoose';

export interface IDepartment extends Document {
  name: string;
  code: string;
  institution: mongoose.Types.ObjectId;
  head?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const departmentSchema = new Schema<IDepartment>(
  {
    name: { type: String, required: true },
    code: { type: String, required: true },
    institution: { type: Schema.Types.ObjectId, ref: 'Institution', required: true },
    head: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const Department = mongoose.model<IDepartment>('Department', departmentSchema);
