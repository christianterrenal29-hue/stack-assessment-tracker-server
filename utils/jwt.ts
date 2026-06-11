import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { UserRole } from '../models/User';

export interface ITokenPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export const generateToken = (payload: ITokenPayload): string => {
  return jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRY as jwt.SignOptions['expiresIn'],
  });
};

export const verifyToken = (token: string): ITokenPayload | null => {
  try {
    return jwt.verify(token, config.JWT_SECRET) as ITokenPayload;
  } catch (error) {
    return null;
  }
};

export const decodeToken = (token: string): ITokenPayload | null => {
  try {
    return jwt.decode(token) as ITokenPayload;
  } catch (error) {
    return null;
  }
};
