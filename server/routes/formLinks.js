import { Router } from 'express';
import { getDb } from '../db/database.js';
import { requireRole, ROLES } from '../middleware/auth.js';
import { logAudit, getClientMeta } from '../utils/audit.js';
import { formatRow, formatRows, sanitizeText, isValidHttpsUrl, boolToInt } from '../utils/sanitize.js';
import { optionalString, optionalBool, optionalUrl, handleValidation } from '../middleware/validate.js';

const router = Router();

router.use(requireRole([...ROLES.CONTENT, ...ROLES.OPPORTUNITIES]));

router.get('/', async (req, res, next) => {
  try {
    const db = getDb();
    const rows = formatRows(await db.all('SELECT * FROM form_links ORDER BY id ASC'));
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const db = getDb();
    const row = await db.get('SELECT * FROM form_links WHERE id = ?', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Form link not found.' });
    res.json(formatRow(row));
  } catch (err) {
    next(err);
  }
});

router.put(
  '/:id',
  [
    optionalString('label'),
    optionalUrl('url'),
    optionalBool('enabled'),
    handleValidation,
  ],
  async (req, res, next) => {
    try {
      const db = getDb();
      const existing = await db.get('SELECT * FROM form_links WHERE id = ?', [req.params.id]);
      if (!existing) return res.status(404).json({ error: 'Form link not found.' });

      const { label, url, enabled } = req.body;
      if (url && !isValidHttpsUrl(url)) {
        return res.status(400).json({ error: 'URL must use HTTPS or be "#" placeholder.' });
      }

      await db.run(`
        UPDATE form_links SET
          label = COALESCE(?, label),
          url = COALESCE(?, url),
          enabled = COALESCE(?, enabled),
          updated_at = datetime('now')
        WHERE id = ?
      `, [
        label != null ? sanitizeText(label) : null,
        url ?? null,
        enabled != null ? boolToInt(enabled) : null,
        req.params.id
      ]);

      const updated = formatRow(await db.get('SELECT * FROM form_links WHERE id = ?', [req.params.id]));
      const { ip, userAgent } = getClientMeta(req);

      await logAudit({
        adminId: req.admin.id,
        adminEmail: req.admin.email,
        action: 'FORM_LINK_UPDATED',
        resourceType: 'form_link',
        resourceId: req.params.id,
        metadata: { key: existing.key, changes: req.body },
        ip,
        userAgent,
      });

      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
