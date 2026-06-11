import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  user: mongoose.Types.ObjectId;
  action: string;
  entity: string;
  entityId: mongoose.Types.ObjectId;
  changes: Record<string, any>;
  ipAddress: string;
  timestamp: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true },
    entity: { type: String, required: true },
    entityId: { type: Schema.Types.ObjectId, required: true },
    changes: { type: Schema.Types.Mixed, default: {} },
    ipAddress: String,
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
