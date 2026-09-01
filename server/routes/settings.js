import { Router } from 'express';
import { getDb } from '../db/database.js';
import { requireRole, ROLES } from '../middleware/auth.js';
import { parseJsonField, sanitizeText } from '../utils/sanitize.js';
import { logAudit, getClientMeta } from '../utils/audit.js';

const router = Router();
router.use(requireRole(ROLES.CONTENT));

router.get('/', async (_req, res, next) => {
  try {
    const settings = {};
    const rows = await getDb().all('SELECT key, value FROM site_settings');
    for (const row of rows) {
      settings[row.key] = parseJsonField(row.value, row.value);
    }
    res.json(settings);
  } catch (error) {
    next(error);
  }
});

router.put('/:key', async (req, res, next) => {
  try {
    const db = getDb();
    const existing = await db.get('SELECT key FROM site_settings WHERE key = ?', [req.params.key]);
    if (!existing) return res.status(404).json({ error: 'Setting not found.' });
    if (req.body.value === undefined) return res.status(400).json({ error: 'A value is required.' });

    const value = typeof req.body.value === 'string' ? sanitizeText(req.body.value) : JSON.stringify(req.body.value);
    await db.run("UPDATE site_settings SET value = ?, updated_at = datetime('now') WHERE key = ?", [value, req.params.key]);

    const { ip, userAgent } = getClientMeta(req);
    await logAudit({
      adminId: req.admin.id,
      adminEmail: req.admin.email,
      action: 'SETTING_UPDATED',
      resourceType: 'site_setting',
      resourceId: req.params.key,
      ip,
      userAgent
    });

    res.json({ key: req.params.key, value: req.body.value });
  } catch (error) {
    next(error);
  }
});

export default router;
