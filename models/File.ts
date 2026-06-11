import mongoose, { Schema, Document } from 'mongoose';

export interface IFile extends Document {
  fileName: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  uploadedBy: mongoose.Types.ObjectId;
  uploadedFor: mongoose.Types.ObjectId;
  requirementType: string;
  status: 'pending' | 'verified' | 'rejected';
  remarks?: string;
  storagePath: string;
  url: string;
  verifiedBy?: mongoose.Types.ObjectId;
  verifiedAt?: Date;
  createdAt: Date;
}

const fileSchema = new Schema<IFile>(
  {
    fileName: { type: String, required: true },
    originalName: { type: String, required: true },
    fileType: { type: String, required: true },
    fileSize: { type: Number, required: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    uploadedFor: { type: Schema.Types.ObjectId, required: true },
    requirementType: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending',
    },
    remarks: String,
    storagePath: { type: String, required: true },
    url: { type: String, required: true },
    verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    verifiedAt: Date,
  },
  { timestamps: true }
);

export const File = mongoose.model<IFile>('File', fileSchema);
