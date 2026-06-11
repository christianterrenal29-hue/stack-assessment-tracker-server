import { Schema, model, Document, Types } from 'mongoose';

export interface ICertificate extends Document {
  student: Types.ObjectId;
  qualification: Types.ObjectId;
  certificateNumber: string;
  issuedDate: Date;
  expiryDate?: Date;
  status: 'issued' | 'revoked' | 'expired';
  qrCode: string;
  documentUrl: string;
  verificationCode: string;
  createdAt: Date;
  updatedAt: Date;
}

const certificateSchema = new Schema<ICertificate>(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    qualification: {
      type: Schema.Types.ObjectId,
      ref: 'Qualification',
      required: true,
      index: true,
    },
    certificateNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    issuedDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    expiryDate: Date,
    status: {
      type: String,
      enum: ['issued', 'revoked', 'expired'],
      default: 'issued',
      index: true,
    },
    qrCode: {
      type: String,
      required: true,
    },
    documentUrl: {
      type: String,
      required: true,
    },
    verificationCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for finding certificates by student
certificateSchema.index({ student: 1, status: 1 });

export default model<ICertificate>('Certificate', certificateSchema);
