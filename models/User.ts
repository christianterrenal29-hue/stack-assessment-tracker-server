import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export const USER_ROLES = [
  'administrator',
  'instructor',
  'assessor',
  'student',
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
  institution?: mongoose.Types.ObjectId;
  department?: mongoose.Types.ObjectId;
  phone?: string;
  avatar?: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(password: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, enum: USER_ROLES, required: true, index: true },
    institution: { type: Schema.Types.ObjectId, ref: 'Institution' },
    department: { type: Schema.Types.ObjectId, ref: 'Department' },
    phone: String,
    avatar: String,
    isActive: { type: Boolean, default: true },
    lastLogin: Date,
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.password);
};

export const User = mongoose.model<IUser>('User', userSchema);
