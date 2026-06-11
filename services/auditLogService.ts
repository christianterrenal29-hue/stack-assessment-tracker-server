import { Types } from 'mongoose';
import { AuditLog } from '../models/AuditLog';

export type CreateAuditLogInput = {
  user?: string;
  action: string;
  entity: string;
  entityId?: string;
  changes?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
};

export class AuditLogService {
  async create(input: CreateAuditLogInput) {
    if (!input.user || !Types.ObjectId.isValid(input.user)) {
      return null;
    }

    const entityId =
      input.entityId && Types.ObjectId.isValid(input.entityId)
        ? input.entityId
        : input.user;

    return AuditLog.create({
      user: input.user,
      action: input.action,
      entity: input.entity,
      entityId,
      changes: {
        ...(input.changes ?? {}),
        userAgent: input.userAgent,
      },
      ipAddress: input.ipAddress,
    });
  }

  async getAll() {
    return AuditLog.find()
      .populate('user', 'firstName lastName email role')
      .sort({ timestamp: -1 })
      .limit(250);
  }
}

export default new AuditLogService();
