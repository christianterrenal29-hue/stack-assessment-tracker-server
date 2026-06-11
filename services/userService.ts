import { USER_ROLES, User, UserRole } from '../models/User';
import { AppError } from '../middleware/errorHandler';

interface UserFilters {
  role?: string;
  institution?: string;
  isActive?: boolean;
}

const isUserRole = (role: string): role is UserRole => {
  return USER_ROLES.includes(role as UserRole);
};

const toUserRole = (role: string): UserRole => {
  if (!isUserRole(role)) {
    throw new AppError(400, 'Invalid user role');
  }

  return role;
};

export class UserService {
  static async getAllUsers(filters?: UserFilters) {
    const query: {
      role?: UserRole;
      institution?: string;
      isActive?: boolean;
    } = {};
    
    if (filters?.role) query.role = toUserRole(filters.role);
    if (filters?.institution) query.institution = filters.institution;
    if (filters?.isActive !== undefined) query.isActive = filters.isActive;

    const users = await User.find(query)
      .populate('institution')
      .populate('department')
      .select('-password')
      .lean();

    return users;
  }

  static async getUserById(userId: string) {
    const user = await User.findById(userId)
      .populate('institution')
      .populate('department')
      .select('-password');

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    return user;
  }

  static async createUser(userData: any) {
    const { email, firstName, lastName, password, role, institution, department } = userData;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError(400, 'User with this email already exists');
    }

    const user = new User({
      firstName,
      lastName,
      email,
      password,
      role,
      institution,
      department,
      isActive: true,
    });

    await user.save();

    const populatedUser = await User.findById(user._id)
      .populate('institution')
      .populate('department')
      .select('-password');

    return populatedUser;
  }

  static async updateUser(userId: string, updateData: any) {
    const { firstName, lastName, email, phone, avatar, role, institution, department, isActive } = updateData;

    // Check if email is being changed and if new email already exists
    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: userId } });
      if (existingUser) {
        throw new AppError(400, 'Email already in use');
      }
    }

    const user = await User.findByIdAndUpdate(
      userId,
      {
        firstName,
        lastName,
        email,
        phone,
        avatar,
        role,
        institution,
        department,
        isActive,
      },
      { new: true }
    )
      .populate('institution')
      .populate('department')
      .select('-password');

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    return user;
  }

  static async deleteUser(userId: string) {
    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    return { message: 'User deleted successfully' };
  }

  static async bulkCreateUsers(usersData: any[]) {
    const createdUsers = [];
    const errors = [];

    for (let i = 0; i < usersData.length; i++) {
      try {
        const userData = usersData[i];
        
        // Check if user exists
        const exists = await User.findOne({ email: userData.email });
        if (exists) {
          errors.push({
            row: i + 1,
            email: userData.email,
            error: 'User already exists',
          });
          continue;
        }

        const user = new User({
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          password: userData.password || 'TempPassword123!',
          role: userData.role || 'student',
          institution: userData.institution,
          department: userData.department,
        });

        await user.save();
        createdUsers.push(user);
      } catch (error: any) {
        errors.push({
          row: i + 1,
          error: error.message,
        });
      }
    }

    return {
      created: createdUsers.length,
      total: usersData.length,
      createdUsers,
      errors,
    };
  }

  static async searchUsers(query: string) {
    const users = await User.find({
      $or: [
        { firstName: { $regex: query, $options: 'i' } },
        { lastName: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
      ],
    })
      .populate('institution')
      .populate('department')
      .select('-password')
      .limit(20);

    return users;
  }

  static async getUsersByRole(role: string) {
    const validRole = toUserRole(role);

    const users = await User.find({ role: validRole })
      .populate('institution')
      .populate('department')
      .select('-password')
      .lean();

    return users;
  }

  static async getUsersByInstitution(institutionId: string) {
    const users = await User.find({ institution: institutionId })
      .populate('institution')
      .populate('department')
      .select('-password')
      .lean();

    return users;
  }
}
