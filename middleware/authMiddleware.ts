import { Request, Response, NextFunction, RequestHandler } from 'express';
import type { ParamsDictionary, Query } from 'express-serve-static-core';
import { verifyToken } from '../utils/jwt';

export type AuthRequest<
  P = ParamsDictionary,
  ResBody = unknown,
  ReqBody = Request['body'],
  ReqQuery = Query
> = Request<P, ResBody, ReqBody, ReqQuery>;

export const authMiddleware: RequestHandler = (req: Request, res: Response, next: NextFunction): void => {
  const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];

  if (!token) {
    res.status(401).json({ status: 'error', statusCode: 401, message: 'No token provided' });
    return;
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    res.status(401).json({ status: 'error', statusCode: 401, message: 'Invalid token' });
    return;
  }

  req.user = decoded;
  next();
};

export const roleCheck = (allowedRoles: string[]): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ status: 'error', statusCode: 401, message: 'Not authenticated' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ status: 'error', statusCode: 403, message: 'Access denied' });
      return;
    }

    next();
  };
};
