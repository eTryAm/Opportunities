import { Router } from 'express';
import { getDb } from '../db/database.js';
import { requireRole } from '../middleware/auth.js';
import { boolToInt, formatRow, formatRows, isValidHttpsUrl, sanitizeText, slugify } from './sanitize.js';
import { logAudit, getClientMeta } from './audit.js';

// Tables, fields and roles are defined by code, never by requests. This keeps dynamic SQL safe.
export function createCrudRouter({ table, label, roles, fields, required = [], jsonFields = [], boolFields = [], urlFields = [], defaultSort = 'created_at DESC', slugField = null }) {
  const router = Router();
  router.use(requireRole(roles));

  const serialise = (field, value) => {
    if (value == null) return null;
    if (urlFields.includes(field) && value && !isValidHttpsUrl(value)) {
      const error = new Error(`${field} must be an HTTPS URL.`); error.status = 400; throw error;
    }
    if (jsonFields.includes(field)) return JSON.stringify(Array.isArray(value) || typeof value === 'object' ? value : []);
    if (boolFields.includes(field)) return boolToInt(value);
    if (typeof value === 'string' && field !== 'application_url' && field !== 'photo_url') return sanitizeText(value);
    return value;
  };

  const rowById = async (db, id) => await db.get(`SELECT * FROM ${table} WHERE id = ?`, [id]);
  const audit = async (req, action, id, metadata = {}) => {
    const { ip, userAgent } = getClientMeta(req);
    await logAudit({ adminId: req.admin.id, adminEmail: req.admin.email, action, resourceType: label, resourceId: id, metadata, ip, userAgent });
  };

  router.get('/', async (req, res, next) => {
    try {
      const rows = await getDb().all(`SELECT * FROM ${table} ORDER BY ${defaultSort}`);
      res.json(formatRows(rows, jsonFields));
    } catch (error) { next(error); }
  });

  router.get('/:id', async (req, res, next) => {
    try {
      const row = await rowById(getDb(), Number(req.params.id));
      if (!row) return res.status(404).json({ error: `${label} not found.` });
      res.json(formatRow(row, jsonFields));
    } catch (error) { next(error); }
  });

  router.post('/', async (req, res, next) => {
    try {
      for (const field of required) {
        if (!req.body[field]) return res.status(400).json({ error: `${field} is required.` });
      }
      const values = {};
      for (const field of fields) {
        if (req.body[field] !== undefined) values[field] = serialise(field, req.body[field]);
      }
      if (slugField && !values[slugField] && values.title) values[slugField] = slugify(values.title);
      const columns = Object.keys(values);
      if (!columns.length) return res.status(400).json({ error: 'No valid fields were provided.' });

      const db = getDb();
      const result = await db.run(
        `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`,
        columns.map((field) => values[field])
      );
      const created = formatRow(await rowById(db, result.lastInsertRowid), jsonFields);
      await audit(req, `${label.toUpperCase()}_CREATED`, created.id, { fields: columns });
      res.status(201).json(created);
    } catch (error) { next(error); }
  });

  router.put('/:id', async (req, res, next) => {
    try {
      const db = getDb();
      const existing = await rowById(db, Number(req.params.id));
      if (!existing) return res.status(404).json({ error: `${label} not found.` });

      const values = {};
      for (const field of fields) {
        if (req.body[field] !== undefined) values[field] = serialise(field, req.body[field]);
      }
      if (slugField && req.body.title && !req.body[slugField]) values[slugField] = slugify(req.body.title);
      const columns = Object.keys(values);
      if (!columns.length) return res.status(400).json({ error: 'No valid fields were provided.' });

      await db.run(
        `UPDATE ${table} SET ${columns.map((field) => `${field} = ?`).join(', ')}, updated_at = datetime('now') WHERE id = ?`,
        [...columns.map((field) => values[field]), existing.id]
      );
      const updated = formatRow(await rowById(db, existing.id), jsonFields);
      await audit(req, `${label.toUpperCase()}_UPDATED`, existing.id, { fields: columns });
      res.json(updated);
    } catch (error) { next(error); }
  });

  router.delete('/:id', async (req, res, next) => {
    try {
      const db = getDb();
      const existing = await rowById(db, Number(req.params.id));
      if (!existing) return res.status(404).json({ error: `${label} not found.` });

      await db.run(`DELETE FROM ${table} WHERE id = ?`, [existing.id]);
      await audit(req, `${label.toUpperCase()}_DELETED`, existing.id, { title: existing.title || existing.question || existing.applicant_name });
      res.json({ message: `${label} deleted.` });
    } catch (error) { next(error); }
  });
  
  router.patch('/:id/toggle-publish', async (req, res, next) => {
    try { 
      if (!boolFields.includes('is_published')) return res.status(400).json({ error: 'Publishing not supported for this resource.' });
      const db = getDb();
      const existing = await rowById(db, Number(req.params.id));
      if (!existing) return res.status(404).json({ error: `${label} not found.` }); 

      const newValue = existing.is_published ? 0 : 1;
      await db.run(`UPDATE ${table} SET is_published = ?, updated_at = datetime('now') WHERE id = ?`, [newValue, existing.id]); 
      await audit(req, `${label.toUpperCase()}_PUBLISH_TOGGLED`, existing.id, { is_published: newValue }); 
      res.json({ message: `${label} publish status updated.`, is_published: newValue }); 
    } catch (error) { next(error); }
  });

  router.patch('/:id/toggle-featured', async (req, res, next) => {
    try { 
      if (!boolFields.includes('is_featured')) return res.status(400).json({ error: 'Featuring not supported for this resource.' });
      const db = getDb();
      const existing = await rowById(db, Number(req.params.id));
      if (!existing) return res.status(404).json({ error: `${label} not found.` }); 

      const newValue = existing.is_featured ? 0 : 1;
      await db.run(`UPDATE ${table} SET is_featured = ?, updated_at = datetime('now') WHERE id = ?`, [newValue, existing.id]); 
      await audit(req, `${label.toUpperCase()}_FEATURED_TOGGLED`, existing.id, { is_featured: newValue }); 
      res.json({ message: `${label} featured status updated.`, is_featured: newValue }); 
    } catch (error) { next(error); }
  });

  return router;
}
