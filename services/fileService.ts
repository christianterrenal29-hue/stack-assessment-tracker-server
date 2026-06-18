import { Types } from 'mongoose';
import { File } from '../models/File';
import { User } from '../models/User';
import Student from '../models/Student';
import cloudinaryService from './cloudinaryService';

export type CreateFileInput = {
  fileName: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  uploadedBy: string;
  uploadedFor: string;
  requirementType: string;
  url: string;
};

export type VerifyFileInput = {
  status: 'pending' | 'verified' | 'rejected';
  remarks?: string;
  verifiedBy: string;
};

export class FileService {
  private populateFileQuery(query: ReturnType<typeof File.find>) {
    return query
      .populate('uploadedBy', 'firstName lastName email role')
      .populate('verifiedBy', 'firstName lastName email role')
      .sort({ createdAt: -1 });
  }

  async getAll() {
    return this.populateFileQuery(File.find());
  }

  async getVisibleForUser(userId: string, role: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user id');
    }

    if (['administrator', 'instructor', 'assessor'].includes(role)) {
      return this.getAll();
    }

    const student = await Student.findOne({ user: userId }).select('_id');
    const uploadedForIds = [new Types.ObjectId(userId)];
    if (student?._id) uploadedForIds.push(student._id as Types.ObjectId);

    return this.populateFileQuery(File.find({ uploadedFor: { $in: uploadedForIds } }));
  }

  async getByUploadedFor(uploadedFor: string) {
    if (!Types.ObjectId.isValid(uploadedFor)) {
      throw new Error('Invalid student/user id');
    }

    return this.populateFileQuery(File.find({ uploadedFor }));
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
    });

    if (input.requirementType === 'Profile Picture') {
      const student = await Student.findById(uploadedFor);
      const userId = student?.user ?? uploadedFor;
      await User.findByIdAndUpdate(userId, { avatar: input.url });
    }

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
    await cloudinaryService.deleteBySecureUrl(file.url, file.fileType).catch(() => undefined);
    return file;
  }

  async canUserAccessFile(fileId: string, userId: string, role: string) {
    if (['administrator', 'instructor', 'assessor'].includes(role)) {
      return true;
    }

    const file = await File.findById(fileId).select('uploadedFor');
    if (!file) return false;

    if (String(file.uploadedFor) === userId) return true;

    const student = await Student.findOne({ user: userId }).select('_id');
    return Boolean(student && String(file.uploadedFor) === String(student._id));
  }
}

export default new FileService();
