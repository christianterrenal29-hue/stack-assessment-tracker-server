import { User } from '../models/User';
import { UserRole } from '../models/User';
import { generateToken } from '../utils/jwt';
import { AppError } from '../middleware/errorHandler';

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
  institution?: string;
  department?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export class AuthService {
  static async register(payload: RegisterPayload) {
    const { email, firstName, lastName, password, role, institution, department } = payload;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError(400, 'User with this email already exists');
    }

    // Create new user
    const user = new User({
      firstName,
      lastName,
      email,
      password,
      role,
      institution,
      department,
    });

    await user.save();

    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    return {
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        institution: user.institution,
        department: user.department,
        isActive: user.isActive,
      },
      token,
    };
  }

  static async login(payload: LoginPayload) {
    const { email, password } = payload;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      throw new AppError(401, 'Invalid credentials');
    }

    // Compare password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new AppError(401, 'Invalid credentials');
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    return {
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        institution: user.institution,
        department: user.department,
        isActive: user.isActive,
      },
      token,
    };
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
}
