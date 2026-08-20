import { Router } from 'express';
import { getDb } from '../db/database.js';
import { requireRole, ROLES } from '../middleware/auth.js';
import { logAudit, getClientMeta } from '../utils/audit.js';
import { fetchSheetApplications } from '../utils/googleSheets.js';

const router = Router();
router.use(requireRole(ROLES.OPPORTUNITIES));

// GET all applications
router.get('/', (req, res, next) => {
  try {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM application_records ORDER BY created_at DESC').all();
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// GET single application
router.get('/:id', (req, res, next) => {
  try {
    const db = getDb();
    const row = db.prepare('SELECT * FROM application_records WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Application not found.' });
    res.json(row);
  } catch (err) {
    next(err);
  }
});

// POST create application manually
router.post('/', (req, res, next) => {
  try {
    const db = getDb();
    const { applicant_name, email, phone, role, district, state, college, status, applied_date, notes, reviewer } = req.body;
    if (!applicant_name || !email || !role) {
      return res.status(400).json({ error: 'Name, email and role are required.' });
    }

    const info = db.prepare(`
      INSERT INTO application_records (applicant_name, email, phone, role, district, state, college, status, applied_date, notes, reviewer)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(applicant_name, email, phone || null, role, district || null, state || null, college || null, status || 'Received', applied_date || null, notes || null, reviewer || null);

    const { ip, userAgent } = getClientMeta(req);
    logAudit({ adminId: req.admin.id, adminEmail: req.admin.email, action: 'APPLICATION_CREATED', resourceType: 'application', resourceId: String(info.lastInsertRowid), ip, userAgent });

    res.status(201).json({ id: info.lastInsertRowid, message: 'Application created.' });
  } catch (err) {
    next(err);
  }
});

// PUT update application status/notes
router.put('/:id', (req, res, next) => {
  try {
    const db = getDb();
    const existing = db.prepare('SELECT id FROM application_records WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Application not found.' });

    const { status, notes, reviewer } = req.body;
    db.prepare("UPDATE application_records SET status = COALESCE(?, status), notes = COALESCE(?, notes), reviewer = COALESCE(?, reviewer), updated_at = datetime('now') WHERE id = ?")
      .run(status || null, notes || null, reviewer || null, req.params.id);

    const { ip, userAgent } = getClientMeta(req);
    logAudit({ adminId: req.admin.id, adminEmail: req.admin.email, action: 'APPLICATION_UPDATED', resourceType: 'application', resourceId: String(req.params.id), ip, userAgent });

    res.json({ message: 'Application updated.' });
  } catch (err) {
    next(err);
  }
});

// DELETE application
router.delete('/:id', (req, res, next) => {
  try {
    const db = getDb();
    const existing = db.prepare('SELECT id FROM application_records WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Application not found.' });

    db.prepare('DELETE FROM application_records WHERE id = ?').run(req.params.id);

    const { ip, userAgent } = getClientMeta(req);
    logAudit({ adminId: req.admin.id, adminEmail: req.admin.email, action: 'APPLICATION_DELETED', resourceType: 'application', resourceId: String(req.params.id), ip, userAgent });

    res.json({ message: 'Application deleted.' });
  } catch (err) {
    next(err);
  }
});

// POST sync from Google Sheet
router.post('/sync-sheet', async (req, res, next) => {
  try {
    const { sheet_url, default_role } = req.body;
    if (!sheet_url) {
      return res.status(400).json({ error: 'A Google Sheet URL is required.' });
    }

    const records = await fetchSheetApplications(sheet_url);

    const db = getDb();
    const insertStmt = db.prepare(`
      INSERT OR IGNORE INTO application_records (applicant_name, email, phone, role, district, state, college, status, applied_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'Received', ?)
    `);

    // Use email as a uniqueness check to avoid duplicates but also update missing fields
    const existingRecords = db.prepare('SELECT id, email, phone, college, district, state FROM application_records').all();
    const emailToId = new Map(existingRecords.map(r => [r.email.toLowerCase(), r]));

    const updateStmt = db.prepare(`
      UPDATE application_records
      SET applicant_name = ?, 
          phone = COALESCE(NULLIF(phone, ''), ?), 
          role = CASE WHEN ? = 'Unknown' THEN role ELSE ? END, 
          district = COALESCE(NULLIF(district, ''), ?), 
          state = COALESCE(NULLIF(state, ''), ?), 
          college = COALESCE(NULLIF(college, ''), ?), 
          applied_date = COALESCE(NULLIF(applied_date, ''), ?)
      WHERE id = ?
    `);

    let imported = 0;
    let updated = 0;
    
    const insertMany = db.transaction((rows) => {
      for (const row of rows) {
        const rowEmail = row.email.toLowerCase();
        const role = row.role || default_role || 'Unknown';
        
        if (emailToId.has(rowEmail)) {
          // Update missing fields
          const existing = emailToId.get(rowEmail);
          updateStmt.run(row.applicant_name, row.phone || null, role, role, row.district || null, row.state || null, row.college || null, row.applied_date || null, existing.id);
          updated++;
        } else {
          insertStmt.run(row.applicant_name, row.email, row.phone || null, role, row.district || null, row.state || null, row.college || null, row.applied_date || null);
          imported++;
        }
      }
    });

    insertMany(records);

    const { ip, userAgent } = getClientMeta(req);
    logAudit({ adminId: req.admin.id, adminEmail: req.admin.email, action: 'SHEET_SYNC', resourceType: 'application', resourceId: `imported:${imported}`, metadata: JSON.stringify({ sheet_url, total_rows: records.length, imported }), ip, userAgent });

    res.json({
      message: `Successfully synced. ${imported} new, ${updated} updated records.`,
      imported,
      updated,
      total: records.length,
    });
  } catch (err) {
    if (err.message.includes('Invalid Google') || err.message.includes('Failed to fetch') || err.message.includes('empty')) {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
});

export default router;
