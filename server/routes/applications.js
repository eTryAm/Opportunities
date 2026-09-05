import { Router } from 'express';
import { getDb } from '../db/database.js';
import { requireRole, ROLES } from '../middleware/auth.js';
import { logAudit, getClientMeta } from '../utils/audit.js';
import { fetchSheetApplications } from '../utils/googleSheets.js';

const router = Router();
router.use(requireRole(ROLES.OPPORTUNITIES));

// GET all applications
router.get('/', async (req, res, next) => {
  try {
    const db = getDb();
    const rows = await db.all('SELECT * FROM application_records ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// GET single application
router.get('/:id', async (req, res, next) => {
  try {
    const db = getDb();
    const row = await db.get('SELECT * FROM application_records WHERE id = ?', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Application not found.' });
    res.json(row);
  } catch (err) {
    next(err);
  }
});

// POST create application manually
router.post('/', async (req, res, next) => {
  try {
    const db = getDb();
    const { applicant_name, email, phone, role, district, state, college, status, applied_date, notes, reviewer } = req.body;
    if (!applicant_name || !email || !role) {
      return res.status(400).json({ error: 'Name, email and role are required.' });
    }

    const info = await db.run(`
      INSERT INTO application_records (applicant_name, email, phone, role, district, state, college, status, applied_date, notes, reviewer)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      applicant_name,
      email,
      phone || null,
      role,
      district || null,
      state || null,
      college || null,
      status || 'Received',
      applied_date || null,
      notes || null,
      reviewer || null
    ]);

    const { ip, userAgent } = getClientMeta(req);
    await logAudit({ adminId: req.admin.id, adminEmail: req.admin.email, action: 'APPLICATION_CREATED', resourceType: 'application', resourceId: String(info.lastInsertRowid), ip, userAgent });

    res.status(201).json({ id: info.lastInsertRowid, message: 'Application created.' });
  } catch (err) {
    next(err);
  }
});

// PUT update application status/notes
router.put('/:id', async (req, res, next) => {
  try {
    const db = getDb();
    const existing = await db.get('SELECT id FROM application_records WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Application not found.' });

    const { status, notes, reviewer } = req.body;
    await db.run(
      "UPDATE application_records SET status = COALESCE(?, status), notes = COALESCE(?, notes), reviewer = COALESCE(?, reviewer), updated_at = datetime('now') WHERE id = ?",
      [status || null, notes || null, reviewer || null, req.params.id]
    );

    const { ip, userAgent } = getClientMeta(req);
    await logAudit({ adminId: req.admin.id, adminEmail: req.admin.email, action: 'APPLICATION_UPDATED', resourceType: 'application', resourceId: String(req.params.id), ip, userAgent });

    res.json({ message: 'Application updated.' });
  } catch (err) {
    next(err);
  }
});

// DELETE application
router.delete('/:id', async (req, res, next) => {
  try {
    const db = getDb();
    const existing = await db.get('SELECT id FROM application_records WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Application not found.' });

    await db.run('DELETE FROM application_records WHERE id = ?', [req.params.id]);

    const { ip, userAgent } = getClientMeta(req);
    await logAudit({ adminId: req.admin.id, adminEmail: req.admin.email, action: 'APPLICATION_DELETED', resourceType: 'application', resourceId: String(req.params.id), ip, userAgent });

    res.json({ message: 'Application deleted.' });
  } catch (err) {
    next(err);
  }
});

function generateAppId() {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let rand = '';
  for (let i = 0; i < 6; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `APP-${rand}`;
}

async function syncRecordsFromSheet(db, sheetUrl, defaultRole) {
  const records = await fetchSheetApplications(sheetUrl);
  
  // Existing records mapped by (email::role) to allow applicants to hold multiple roles
  const existingRecords = await db.all('SELECT id, application_id, email, phone, role, college, district, state FROM application_records');
  const dedupeMap = new Map();
  for (const r of existingRecords) {
    if (r.email) {
      const key = `${r.email.toLowerCase()}::${(r.role || '').toLowerCase()}`;
      dedupeMap.set(key, r);
    }
  }

  let imported = 0;
  let updated = 0;

  for (const row of records) {
    const rowEmail = (row.email || '').toLowerCase();
    const role = (row.role || defaultRole || 'General Applicant').trim();
    const dedupeKey = `${rowEmail}::${role.toLowerCase()}`;

    if (rowEmail && dedupeMap.has(dedupeKey)) {
      const existing = dedupeMap.get(dedupeKey);
      await db.run(`
        UPDATE application_records
        SET applicant_name = ?, 
            phone = COALESCE(NULLIF(phone, ''), ?), 
            district = COALESCE(NULLIF(district, ''), ?), 
            state = COALESCE(NULLIF(state, ''), ?), 
            college = COALESCE(NULLIF(college, ''), ?), 
            applied_date = COALESCE(NULLIF(applied_date, ''), ?),
            updated_at = datetime('now')
        WHERE id = ?
      `, [
        row.applicant_name,
        row.phone || null,
        row.district || null,
        row.state || null,
        row.college || null,
        row.applied_date || null,
        existing.id
      ]);
      updated++;
    } else {
      const appId = generateAppId();
      await db.run(`
        INSERT INTO application_records (application_id, applicant_name, email, phone, role, district, state, college, status, applied_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Received', ?)
      `, [
        appId,
        row.applicant_name,
        row.email || 'applicant@portal.local',
        row.phone || null,
        role,
        row.district || null,
        row.state || null,
        row.college || null,
        row.applied_date || null
      ]);
      imported++;
      if (rowEmail) {
        dedupeMap.set(dedupeKey, { email: rowEmail, role });
      }
    }
  }

  return { imported, updated, total: records.length };
}

// GET configured application sheet sources from form_links
router.get('/sources/list', async (_req, res, next) => {
  try {
    const db = getDb();
    const rows = await db.all('SELECT id, key, label, url, sheet_url FROM form_links ORDER BY id ASC');
    const sources = rows.map((r) => ({
      id: r.id,
      key: r.key,
      label: r.label,
      roleName: r.label.replace(/\s+Application$/i, ''),
      formUrl: r.url,
      sheetUrl: r.sheet_url || '',
      hasSheet: Boolean(r.sheet_url && r.sheet_url.trim().length > 5),
    }));
    res.json(sources);
  } catch (err) {
    next(err);
  }
});

// POST sync from a single Google Sheet (with option to persist sheet_url for that role)
router.post('/sync-sheet', async (req, res, next) => {
  try {
    const { sheet_url, default_role, form_key, save_sheet_url } = req.body;
    if (!sheet_url) {
      return res.status(400).json({ error: 'A Google Sheet URL is required.' });
    }

    const db = getDb();
    const role = default_role || 'General Applicant';
    const { imported, updated, total } = await syncRecordsFromSheet(db, sheet_url, role);

    // Save sheet_url to form_links if requested
    if (save_sheet_url && form_key) {
      await db.run('UPDATE form_links SET sheet_url = ?, updated_at = datetime(\'now\') WHERE key = ?', [
        sheet_url.trim(),
        form_key,
      ]);
    }

    const { ip, userAgent } = getClientMeta(req);
    await logAudit({
      adminId: req.admin.id,
      adminEmail: req.admin.email,
      action: 'SHEET_SYNC',
      resourceType: 'application',
      resourceId: `imported:${imported}`,
      metadata: { sheet_url, role, total_rows: total, imported, updated },
      ip,
      userAgent,
    });

    res.json({
      message: `Successfully synced ${role}. ${imported} new, ${updated} updated records (Total: ${total}).`,
      imported,
      updated,
      total,
      role,
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

// POST sync all connected sheets in one action
router.post('/sync-all', async (req, res, next) => {
  try {
    const db = getDb();
    const rows = await db.all('SELECT key, label, sheet_url FROM form_links WHERE sheet_url IS NOT NULL AND length(sheet_url) > 10');

    if (rows.length === 0) {
      return res.status(400).json({
        error: 'No connected Google Sheet URLs found. Please configure a Sheet URL for each role first.',
      });
    }

    let totalImported = 0;
    let totalUpdated = 0;
    let totalRows = 0;
    const summaries = [];
    const errors = [];

    for (const link of rows) {
      const role = link.label.replace(/\s+Application$/i, '');
      try {
        const result = await syncRecordsFromSheet(db, link.sheet_url, role);
        totalImported += result.imported;
        totalUpdated += result.updated;
        totalRows += result.total;
        summaries.push({
          role,
          imported: result.imported,
          updated: result.updated,
          total: result.total,
        });
      } catch (err) {
        errors.push({ role, error: err.message });
      }
    }

    const { ip, userAgent } = getClientMeta(req);
    await logAudit({
      adminId: req.admin.id,
      adminEmail: req.admin.email,
      action: 'SHEET_SYNC_ALL',
      resourceType: 'application',
      resourceId: `total_imported:${totalImported}`,
      metadata: { total_imported: totalImported, total_updated: totalUpdated, summaries, errors },
      ip,
      userAgent,
    });

    res.json({
      message: `Sync complete across ${summaries.length} sheet(s). ${totalImported} new, ${totalUpdated} updated records.`,
      total_imported: totalImported,
      total_updated: totalUpdated,
      total_rows: totalRows,
      summaries,
      errors,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
