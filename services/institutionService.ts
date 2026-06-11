import { Institution } from '../models/Institution';
import { AppError } from '../middleware/errorHandler';

export class InstitutionService {
  static async getAllInstitutions() {
    const institutions = await Institution.find().lean();
    return institutions;
  }

  static async getInstitutionById(institutionId: string) {
    const institution = await Institution.findById(institutionId);

    if (!institution) {
      throw new AppError(404, 'Institution not found');
    }

    return institution;
  }

  static async createInstitution(institutionData: any) {
    const { name, code, address, phone, email, logo } = institutionData;

    if (!name || !code) {
      throw new AppError(400, 'Name and code are required');
    }

    // Check if institution with same code already exists
    const existingInstitution = await Institution.findOne({ code });
    if (existingInstitution) {
      throw new AppError(400, 'Institution with this code already exists');
    }

    const institution = new Institution({
      name,
      code,
      address,
      phone,
      email,
      logo,
    });

    await institution.save();
    return institution;
  }

  static async updateInstitution(institutionId: string, updateData: any) {
    const { name, code, address, phone, email, logo } = updateData;

    // Check if code is being changed and if new code already exists
    if (code) {
      const existing = await Institution.findOne({ code, _id: { $ne: institutionId } });
      if (existing) {
        throw new AppError(400, 'Institution code already in use');
      }
    }

    const institution = await Institution.findByIdAndUpdate(
      institutionId,
      {
        name,
        code,
        address,
        phone,
        email,
        logo,
      },
      { new: true }
    );

    if (!institution) {
      throw new AppError(404, 'Institution not found');
    }

    return institution;
  }

  static async deleteInstitution(institutionId: string) {
    const institution = await Institution.findByIdAndDelete(institutionId);

    if (!institution) {
      throw new AppError(404, 'Institution not found');
    }

    return { message: 'Institution deleted successfully' };
  }

  static async searchInstitutions(query: string) {
    const institutions = await Institution.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { code: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
      ],
    }).limit(20);

    return institutions;
  }
}
