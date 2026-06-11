import fs from 'node:fs/promises';
import { Types } from 'mongoose';
import { File } from '../models/File';

export type CreateFileInput = {
  fileName: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  uploadedBy: string;
  uploadedFor: string;
  requirementType: string;
  storagePath: string;
};

export type VerifyFileInput = {
  status: 'pending' | 'verified' | 'rejected';
  remarks?: string;
  verifiedBy: string;
};

export class FileService {
  async getAll() {
    return File.find()
      .populate('uploadedBy', 'firstName lastName email role')
      .populate('verifiedBy', 'firstName lastName email role')
      .sort({ createdAt: -1 });
  }

  async create(input: CreateFileInput) {
    if (!Types.ObjectId.isValid(input.uploadedBy)) {
      throw new Error('Invalid uploader');
    }

    const uploadedFor = Types.ObjectId.isValid(input.uploadedFor)
      ? input.uploadedFor
      : input.uploadedBy;

    const file = await File.create({
      ...input,
      uploadedFor,
      url: `/api/files`,
    });

    file.url = `/api/files/${file._id}/download`;
    await file.save();

    return file;
  }

  async getById(id: string) {
    if (!Types.ObjectId.isValid(id)) return null;
    return File.findById(id)
      .populate('uploadedBy', 'firstName lastName email role')
      .populate('verifiedBy', 'firstName lastName email role');
  }

  async verify(id: string, input: VerifyFileInput) {
    if (!Types.ObjectId.isValid(id)) return null;
    return File.findByIdAndUpdate(
      id,
      {
        status: input.status,
        remarks: input.remarks,
        verifiedBy: input.verifiedBy,
        verifiedAt: new Date(),
      },
      { new: true }
    );
  }

  async delete(id: string) {
    const file = await this.getById(id);
    if (!file) return null;

    await File.findByIdAndDelete(id);
    await fs.unlink(file.storagePath).catch(() => undefined);
    return file;
  }
}

export default new FileService();
