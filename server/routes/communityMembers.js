import { Router } from 'express';
import { getDb } from '../db/database.js';
import { authenticate, requireRole, ROLES } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

// GET all community members with optional filters
router.get('/', requireRole(ROLES.ALL_ADMINS), async (req, res, next) => {
  try {
    const db = getDb();
    const { search, location, sort } = req.query;

    let query = 'SELECT * FROM community_members';
    const conditions = [];
    const params = [];

    if (search) {
      conditions.push('(name LIKE ? OR member_id LIKE ? OR phone LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (location) {
      conditions.push('location LIKE ?');
      params.push(`%${location}%`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    if (sort === 'name') {
      query += ' ORDER BY name ASC';
    } else if (sort === 'oldest') {
      query += ' ORDER BY created_at ASC';
    } else {
      query += ' ORDER BY created_at DESC';
    }

    const rows = await db.all(query, params);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// GET a single community member by id
router.get('/:id', requireRole(ROLES.ALL_ADMINS), async (req, res, next) => {
  try {
    const db = getDb();
    const row = await db.get('SELECT * FROM community_members WHERE id = ?', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Member not found.' });
    res.json(row);
  } catch (err) {
    next(err);
  }
});

// DELETE a community member
router.delete('/:id', requireRole(ROLES.ALL_ADMINS), async (req, res, next) => {
  try {
    const db = getDb();
    const existing = await db.get('SELECT id, name FROM community_members WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Member not found.' });

    await db.run('DELETE FROM community_members WHERE id = ?', [req.params.id]);
    res.json({ message: `Member "${existing.name}" removed.` });
  } catch (err) {
    next(err);
  }
});

export default router;
