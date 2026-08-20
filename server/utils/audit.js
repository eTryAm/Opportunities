import { getDb } from '../db/database.js';

export function logAudit({
  adminId = null,
  adminEmail = null,
  action,
  resourceType = null,
  resourceId = null,
  metadata = null,
  ip = null,
  userAgent = null,
}) {
  const db = getDb();
  db.prepare(`
    INSERT INTO audit_logs (admin_id, admin_email, action, resource_type, resource_id, metadata, ip, user_agent)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    adminId,
    adminEmail,
    action,
    resourceType,
    resourceId != null ? String(resourceId) : null,
    metadata ? JSON.stringify(metadata) : null,
    ip,
    userAgent
  );
}

export function getClientMeta(req) {
  return {
    ip: req.ip || req.headers['x-forwarded-for'] || null,
    userAgent: req.headers['user-agent'] || null,
  };
}
