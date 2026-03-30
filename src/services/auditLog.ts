import prisma from '../config/database';
import { AuditAction } from '@prisma/client';

export interface AuditLogData {
  userId: string;
  action: AuditAction;
  resourceType?: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  deviceInfo?: string;
  metadata?: Record<string, any>;
}

export async function createAuditLog(data: AuditLogData): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        resourceType: data.resourceType,
        resourceId: data.resourceId,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        deviceInfo: data.deviceInfo,
        metadata: data.metadata,
      },
    });
  } catch (err) {
    // Audit logging should never break the main flow
    console.error('❌ Audit log creation failed:', err);
  }
}
