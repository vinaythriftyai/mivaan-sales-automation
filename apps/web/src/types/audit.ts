export type AuditEvent = {
  _id: string;
  tenantId: string;
  entityType: string;
  entityId: string;
  action: string;
  actorId?: string;
  actorRole?: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
};