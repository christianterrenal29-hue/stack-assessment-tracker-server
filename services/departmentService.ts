import { Department } from '../models/Department';
import { Institution } from '../models/Institution';
import { AppError } from '../middleware/errorHandler';

export class DepartmentService {
  static async getAllDepartments(filters?: any) {
    const query: any = {};

    if (filters?.institution) query.institution = filters.institution;

    const departments = await Department.find(query)
      .populate('institution')
      .populate('head')
      .lean();

    return departments;
  }

  static async getDepartmentById(departmentId: string) {
    const department = await Department.findById(departmentId)
      .populate('institution')
      .populate('head');

    if (!department) {
      throw new AppError(404, 'Department not found');
    }

    return department;
  }

  static async createDepartment(departmentData: any) {
    const { name, code, institution, head } = departmentData;

    if (!name || !code || !institution) {
      throw new AppError(400, 'Name, code, and institution are required');
    }

    // Verify institution exists
    const institutionExists = await Institution.findById(institution);
    if (!institutionExists) {
      throw new AppError(404, 'Institution not found');
    }

    const department = new Department({
      name,
      code,
      institution,
      head,
    });

    await department.save();
    return await department.populate(['institution', 'head']);
  }

  static async updateDepartment(departmentId: string, updateData: any) {
    const { name, code, institution, head } = updateData;

    // If institution is being changed, verify it exists
    if (institution) {
      const institutionExists = await Institution.findById(institution);
      if (!institutionExists) {
        throw new AppError(404, 'Institution not found');
      }
    }

    const department = await Department.findByIdAndUpdate(
      departmentId,
      {
        name,
        code,
        institution,
        head,
      },
      { new: true }
    )
      .populate('institution')
      .populate('head');

    if (!department) {
      throw new AppError(404, 'Department not found');
    }

    return department;
  }

  static async deleteDepartment(departmentId: string) {
    const department = await Department.findByIdAndDelete(departmentId);

    if (!department) {
      throw new AppError(404, 'Department not found');
    }

    return { message: 'Department deleted successfully' };
  }

  static async getDepartmentsByInstitution(institutionId: string) {
    const departments = await Department.find({ institution: institutionId })
      .populate('institution')
      .populate('head')
      .lean();

    return departments;
  }

  static async searchDepartments(query: string) {
    const departments = await Department.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { code: { $regex: query, $options: 'i' } },
      ],
    })
      .populate('institution')
      .populate('head')
      .limit(20);

    return departments;
  }

  static async setDepartmentHead(departmentId: string, headId: string) {
    const department = await Department.findByIdAndUpdate(
      departmentId,
      { head: headId },
      { new: true }
    )
      .populate('institution')
      .populate('head');

    if (!department) {
      throw new AppError(404, 'Department not found');
    }

    return department;
  }
}
