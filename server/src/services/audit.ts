import type { Request } from 'express';
import AuditLog from '../models/AuditLog.js';

interface Actor { _id?: unknown; role?: string | null }

export async function audit(
  actor: Actor | undefined | null,
  action: string,
  entityType?: string,
  entityId?: unknown,
  metadata?: Record<string, unknown>,
  req?: Request
): Promise<void> {
  try {
    await AuditLog.create({
      actorId: actor?._id,
      role: actor?.role ?? 'system',
      action,
      entityType,
      entityId: entityId ? String(entityId) : undefined,
      metadata,
      ip: req?.ip,
    });
  } catch (e) {
    console.error('audit log write failed:', (e as Error).message);
  }
}
