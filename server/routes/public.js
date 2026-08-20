import { Router } from 'express';
import { getDb } from '../db/database.js';
import { formatRow, formatRows, parseJsonField } from '../utils/sanitize.js';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, '../uploads/community_photos');
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG and WebP images are allowed.'), false);
    }
  },
});

function generateMemberId() {
  const bytes = crypto.randomBytes(4);
  return 'YEH-' + bytes.toString('hex').toUpperCase().slice(0, 6);
}

const router = Router();

function getSettingsMap(db) {
  const rows = db.prepare('SELECT key, value FROM site_settings').all();
  const settings = {};
  for (const row of rows) {
    settings[row.key] = parseJsonField(row.value, row.value);
  }
  return settings;
}

router.get('/home', (req, res, next) => {
  try {
    const db = getDb();
    const settings = getSettingsMap(db);

    const opportunities = formatRows(
      db.prepare(`
        SELECT * FROM opportunities WHERE is_published = 1 ORDER BY sort_order ASC, title ASC LIMIT 6
      `).all(),
      ['benefits', 'responsibilities']
    );

    const events = formatRows(
      db.prepare(`
        SELECT * FROM events WHERE is_published = 1 ORDER BY event_date ASC LIMIT 4
      `).all()
    );

    const announcements = formatRows(
      db.prepare(`
        SELECT * FROM announcements WHERE is_published = 1 ORDER BY is_featured DESC, published_at DESC LIMIT 4
      `).all()
    );

    const testimonials = formatRows(
      db.prepare(`
        SELECT * FROM testimonials WHERE is_published = 1 ORDER BY sort_order ASC LIMIT 6
      `).all()
    );

    const faqs = formatRows(
      db.prepare(`
        SELECT * FROM faqs WHERE is_published = 1 ORDER BY sort_order ASC LIMIT 6
      `).all()
    );

    const impact = formatRows(
      db.prepare(`
        SELECT * FROM impact_statistics WHERE is_visible = 1 ORDER BY sort_order ASC
      `).all()
    );

    const socialLinks = formatRows(
      db.prepare(`
        SELECT * FROM social_links WHERE is_visible = 1 ORDER BY sort_order ASC
      `).all()
    );

    const formLinks = formatRows(
      db.prepare(`
        SELECT key, label, url, enabled FROM form_links WHERE enabled = 1 ORDER BY id ASC
      `).all()
    );

    const campusAmbassador = formatRow(
      db.prepare('SELECT * FROM campus_ambassador_settings WHERE id = 1 AND is_visible = 1').get(),
      ['benefits', 'responsibilities']
    );

    res.json({
      settings: {
        orgName: settings.org_name,
        heroHeadline: settings.hero_headline,
        heroSubheadline: settings.hero_subheadline,
        heroPrimaryCta: settings.hero_primary_cta,
        heroSecondaryCta: settings.hero_secondary_cta,
        aboutTitle: settings.about_title,
        aboutContent: settings.about_content,
        aboutPillars: settings.about_pillars,
        mission: settings.mission,
        vision: settings.vision,
        whyJoin: settings.why_join,
        howItWorks: settings.how_it_works,
        leadershipStructure: settings.leadership_structure,
        trustStrip: settings.trust_strip,
        footerDescription: settings.footer_description,
        contactEmail: settings.contact_email,
        contactLocation: settings.contact_location,
        seoTitle: settings.seo_title,
        seoDescription: settings.seo_description,
        theme: {
          primary: settings.theme_primary_color,
          secondary: settings.theme_secondary_color,
          accent: settings.theme_accent_color,
        },
      },
      opportunities,
      events,
      announcements,
      testimonials,
      faqs,
      impact,
      socialLinks,
      formLinks,
      campusAmbassador,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/settings', (req, res, next) => {
  try {
    const db = getDb();
    res.json(getSettingsMap(db));
  } catch (err) {
    next(err);
  }
});

router.get('/form-links', (req, res, next) => {
  try {
    const db = getDb();
    const links = formatRows(
      db.prepare('SELECT key, label, url, enabled FROM form_links WHERE enabled = 1').all()
    );
    res.json(links);
  } catch (err) {
    next(err);
  }
});

router.get('/opportunities', (req, res, next) => {
  try {
    const db = getDb();
    const rows = formatRows(
      db.prepare(`
        SELECT * FROM opportunities WHERE is_published = 1 ORDER BY sort_order ASC, title ASC
      `).all(),
      ['benefits', 'responsibilities']
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.get('/opportunities/:slug', (req, res, next) => {
  try {
    const db = getDb();
    const row = db.prepare(`
      SELECT * FROM opportunities WHERE slug = ? AND is_published = 1
    `).get(req.params.slug);

    if (!row) {
      return res.status(404).json({ error: 'Opportunity not found.' });
    }

    res.json(formatRow(row, ['benefits', 'responsibilities']));
  } catch (err) {
    next(err);
  }
});

router.get('/events', (req, res, next) => {
  try {
    const db = getDb();
    const rows = formatRows(
      db.prepare(`
        SELECT * FROM events WHERE is_published = 1 ORDER BY event_date ASC, created_at DESC
      `).all()
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.get('/announcements', (req, res, next) => {
  try {
    const db = getDb();
    const rows = formatRows(
      db.prepare(`
        SELECT * FROM announcements WHERE is_published = 1 ORDER BY is_featured DESC, published_at DESC, created_at DESC
      `).all()
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.get('/testimonials', (req, res, next) => {
  try {
    const db = getDb();
    const rows = formatRows(
      db.prepare(`
        SELECT * FROM testimonials WHERE is_published = 1 ORDER BY sort_order ASC, created_at DESC
      `).all()
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.get('/faqs', (req, res, next) => {
  try {
    const db = getDb();
    const rows = formatRows(
      db.prepare(`
        SELECT * FROM faqs WHERE is_published = 1 ORDER BY sort_order ASC, created_at ASC
      `).all()
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.get('/impact', (req, res, next) => {
  try {
    const db = getDb();
    const rows = formatRows(
      db.prepare(`
        SELECT * FROM impact_statistics WHERE is_visible = 1 ORDER BY sort_order ASC
      `).all()
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.get('/social-links', (req, res, next) => {
  try {
    const db = getDb();
    const rows = formatRows(
      db.prepare(`
        SELECT * FROM social_links WHERE is_visible = 1 ORDER BY sort_order ASC
      `).all()
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.get('/campus-ambassador', (req, res, next) => {
  try {
    const db = getDb();
    const row = db.prepare(`
      SELECT * FROM campus_ambassador_settings WHERE id = 1 AND is_visible = 1
    `).get();

    if (!row) {
      return res.status(404).json({ error: 'Campus Ambassador program not available.' });
    }

    res.json(formatRow(row, ['benefits', 'responsibilities']));
  } catch (err) {
    next(err);
  }
});

router.get('/comparison', (req, res, next) => {
  try {
    const db = getDb();
    const row = db.prepare("SELECT value FROM site_settings WHERE key = 'comparison_matrix'").get();
    res.json(parseJsonField(row?.value, { rows: [], columns: [] }));
  } catch (err) {
    next(err);
  }
});

router.post('/testimonials', (req, res, next) => {
  try {
    const { name, role, organization, content } = req.body;
    
    if (!name || !content) {
      return res.status(400).json({ error: 'Name and content are required.' });
    }

    const db = getDb();
    const stmt = db.prepare(`
      INSERT INTO testimonials (name, role, organization, content, is_published, sort_order)
      VALUES (?, ?, ?, ?, 0, 99)
    `);
    
    const info = stmt.run(
      name,
      role || null,
      organization || null,
      content
    );

    res.status(201).json({ 
      message: 'Testimonial submitted successfully. It is pending review.',
      id: info.lastInsertRowid 
    });
  } catch (err) {
    next(err);
  }
});

router.post('/community/join', (req, res, next) => {
  upload.single('photo')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'Image must be under 5MB.' });
      }
      return res.status(400).json({ error: err.message || 'Upload failed.' });
    }

    try {
      const name = (req.body.name || '').trim();
      const phone = (req.body.phone || '').trim();
      const location = (req.body.location || '').trim();

      if (!name || !phone || !location) {
        return res.status(400).json({ error: 'Name, phone, and location are required.' });
      }

      const photoUrl = req.file ? `/uploads/community_photos/${req.file.filename}` : null;
      const db = getDb();

      let memberId;
      let found = false;
      for (let i = 0; i < 10; i++) {
        memberId = generateMemberId();
        const existing = db.prepare('SELECT member_id FROM community_members WHERE member_id = ?').get(memberId);
        if (!existing) { found = true; break; }
      }
      if (!found) {
        return res.status(500).json({ error: 'Could not generate a unique member ID. Please try again.' });
      }

      const stmt = db.prepare(`
        INSERT INTO community_members (member_id, name, phone, location, photo_url)
        VALUES (?, ?, ?, ?, ?)
      `);

      stmt.run(memberId, name, phone, location, photoUrl);

      res.status(201).json({
        message: 'Successfully joined the community!',
        member_id: memberId,
        name,
        location,
        photo_url: photoUrl
      });
    } catch (innerErr) {
      next(innerErr);
    }
  });
});

router.get('/community/member/:memberId', (req, res, next) => {
  try {
    const db = getDb();
    const id = (req.params.memberId || '').trim().toUpperCase();
    const row = db.prepare(`
      SELECT member_id, name, phone, location, photo_url, created_at 
      FROM community_members 
      WHERE member_id = ?
    `).get(id);

    if (!row) {
      return res.status(404).json({ error: 'Member not found. Please check your Member ID.' });
    }

    res.json(row);
  } catch (err) {
    next(err);
  }
});

export default router;
