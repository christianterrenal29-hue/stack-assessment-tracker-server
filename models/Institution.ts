import mongoose, { Schema, Document } from 'mongoose';

export interface IInstitution extends Document {
  name: string;
  code: string;
  address?: string;
  phone?: string;
  email?: string;
  logo?: string;
  createdAt: Date;
  updatedAt: Date;
}

const institutionSchema = new Schema<IInstitution>(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    address: String,
    phone: String,
    email: String,
    logo: String,
  },
  { timestamps: true }
);

export const Institution = mongoose.model<IInstitution>('Institution', institutionSchema);
