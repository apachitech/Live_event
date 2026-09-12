import { prisma } from '@/lib/prisma';

export interface AuditLogOptions {
  actorUserId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  payload?: any;
}

/**
 * Hard-copies data changes into persistent storage (AuditLog).
 * Guaranteed not to throw uncaught exceptions so it doesn't interrupt primary workflows.
 */
export async function logChangeData({
  actorUserId = null,
  action,
  entityType,
  entityId,
  payload = null,
}: AuditLogOptions) {
  try {
    const payloadStr = payload
      ? typeof payload === 'string'
        ? payload
        : JSON.stringify(payload)
      : null;

    return await prisma.auditLog.create({
      data: {
        actorUserId: actorUserId || null,
        action,
        entityType,
        entityId: String(entityId),
        payload: payloadStr,
      },
    });
  } catch (err: any) {
    console.error(`[ChangeData Capture Error] Failed to hard-copy change data for ${action}:`, err.message);
    return null;
  }
}
