import { Router } from 'express';
import crypto from 'crypto';
import { getDb } from '../db/database.js';
import { formatRow, formatRows, parseJsonField } from '../utils/sanitize.js';
import { uploadMiddleware, uploadCommunityPhoto } from '../storage/cloudStorage.js';

function generateMemberId() {
  const bytes = crypto.randomBytes(4);
  return 'YEH-' + bytes.toString('hex').toUpperCase().slice(0, 6);
}

const router = Router();

async function getSettingsMap(db) {
  const rows = await db.all('SELECT key, value FROM site_settings');
  const settings = {};
  for (const row of rows) {
    settings[row.key] = parseJsonField(row.value, row.value);
  }
  return settings;
}

router.get('/home', async (req, res, next) => {
  try {
    const db = getDb();
    const settings = await getSettingsMap(db);

    const opportunities = formatRows(
      await db.all(`
        SELECT * FROM opportunities WHERE is_published = 1 ORDER BY sort_order ASC, title ASC LIMIT 6
      `),
      ['benefits', 'responsibilities']
    );

    const events = formatRows(
      await db.all(`
        SELECT * FROM events WHERE is_published = 1 ORDER BY event_date ASC LIMIT 4
      `)
    );

    const announcements = formatRows(
      await db.all(`
        SELECT * FROM announcements WHERE is_published = 1 ORDER BY is_featured DESC, published_at DESC LIMIT 4
      `)
    );

    const testimonials = formatRows(
      await db.all(`
        SELECT * FROM testimonials WHERE is_published = 1 ORDER BY sort_order ASC LIMIT 6
      `)
    );

    const faqs = formatRows(
      await db.all(`
        SELECT * FROM faqs WHERE is_published = 1 ORDER BY sort_order ASC LIMIT 6
      `)
    );

    const impact = formatRows(
      await db.all(`
        SELECT * FROM impact_statistics WHERE is_visible = 1 ORDER BY sort_order ASC
      `)
    );

    const socialLinks = formatRows(
      await db.all(`
        SELECT * FROM social_links WHERE is_visible = 1 ORDER BY sort_order ASC
      `)
    );

    const formLinks = formatRows(
      await db.all(`
        SELECT key, label, url, enabled FROM form_links WHERE enabled = 1 ORDER BY id ASC
      `)
    );

    const campusAmbassador = formatRow(
      await db.get('SELECT * FROM campus_ambassador_settings WHERE id = 1 AND is_visible = 1'),
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

router.get('/settings', async (req, res, next) => {
  try {
    const db = getDb();
    res.json(await getSettingsMap(db));
  } catch (err) {
    next(err);
  }
});

router.get('/form-links', async (req, res, next) => {
  try {
    const db = getDb();
    const links = formatRows(
      await db.all('SELECT key, label, url, enabled FROM form_links WHERE enabled = 1')
    );
    res.json(links);
  } catch (err) {
    next(err);
  }
});

router.get('/opportunities', async (req, res, next) => {
  try {
    const db = getDb();
    const rows = formatRows(
      await db.all(`
        SELECT * FROM opportunities WHERE is_published = 1 ORDER BY sort_order ASC, title ASC
      `),
      ['benefits', 'responsibilities']
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.get('/opportunities/:slug', async (req, res, next) => {
  try {
    const db = getDb();
    const row = await db.get(`
      SELECT * FROM opportunities WHERE slug = ? AND is_published = 1
    `, [req.params.slug]);

    if (!row) {
      return res.status(404).json({ error: 'Opportunity not found.' });
    }

    res.json(formatRow(row, ['benefits', 'responsibilities']));
  } catch (err) {
    next(err);
  }
});

router.get('/events', async (req, res, next) => {
  try {
    const db = getDb();
    const rows = formatRows(
      await db.all(`
        SELECT * FROM events WHERE is_published = 1 ORDER BY event_date ASC, created_at DESC
      `)
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.get('/announcements', async (req, res, next) => {
  try {
    const db = getDb();
    const rows = formatRows(
      await db.all(`
        SELECT * FROM announcements WHERE is_published = 1 ORDER BY is_featured DESC, published_at DESC, created_at DESC
      `)
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.get('/testimonials', async (req, res, next) => {
  try {
    const db = getDb();
    const rows = formatRows(
      await db.all(`
        SELECT * FROM testimonials WHERE is_published = 1 ORDER BY sort_order ASC, created_at DESC
      `)
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.get('/faqs', async (req, res, next) => {
  try {
    const db = getDb();
    const rows = formatRows(
      await db.all(`
        SELECT * FROM faqs WHERE is_published = 1 ORDER BY sort_order ASC, created_at ASC
      `)
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.get('/impact', async (req, res, next) => {
  try {
    const db = getDb();
    const rows = formatRows(
      await db.all(`
        SELECT * FROM impact_statistics WHERE is_visible = 1 ORDER BY sort_order ASC
      `)
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.get('/social-links', async (req, res, next) => {
  try {
    const db = getDb();
    const rows = formatRows(
      await db.all(`
        SELECT * FROM social_links WHERE is_visible = 1 ORDER BY sort_order ASC
      `)
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.get('/campus-ambassador', async (req, res, next) => {
  try {
    const db = getDb();
    const row = await db.get(`
      SELECT * FROM campus_ambassador_settings WHERE id = 1 AND is_visible = 1
    `);

    if (!row) {
      return res.status(404).json({ error: 'Campus Ambassador program not available.' });
    }

    res.json(formatRow(row, ['benefits', 'responsibilities']));
  } catch (err) {
    next(err);
  }
});

router.get('/comparison', async (req, res, next) => {
  try {
    const db = getDb();
    const row = await db.get("SELECT value FROM site_settings WHERE key = 'comparison_matrix'");
    res.json(parseJsonField(row?.value, { rows: [], columns: [] }));
  } catch (err) {
    next(err);
  }
});

router.post('/testimonials', async (req, res, next) => {
  try {
    const { name, role, organization, content } = req.body;
    
    if (!name || !content) {
      return res.status(400).json({ error: 'Name and content are required.' });
    }

    const db = getDb();
    const info = await db.run(`
      INSERT INTO testimonials (name, role, organization, content, is_published, sort_order)
      VALUES (?, ?, ?, ?, 0, 99)
    `, [name, role || null, organization || null, content]);

    res.status(201).json({ 
      message: 'Testimonial submitted successfully. It is pending review.',
      id: info.lastInsertRowid 
    });
  } catch (err) {
    next(err);
  }
});

router.post('/community/join', (req, res, next) => {
  uploadMiddleware.single('photo')(req, res, async (err) => {
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

      const db = getDb();

      // Check if user with this contact number is already a registered member
      const cleanPhone = phone.replace(/[\s\-\(\)\+]/g, '');
      const existingMember = await db.get(
        `SELECT * FROM community_members 
         WHERE phone = ? 
            OR REPLACE(REPLACE(REPLACE(REPLACE(phone, ' ', ''), '-', ''), '+', ''), '(', '') LIKE ?`,
        [phone, `%${cleanPhone.length >= 10 ? cleanPhone.slice(-10) : cleanPhone}%`]
      );

      if (existingMember) {
        return res.status(200).json({
          alreadyMember: true,
          message: `You are already a registered member with Member ID: ${existingMember.member_id}`,
          member_id: existingMember.member_id,
          name: existingMember.name,
          phone: existingMember.phone,
          location: existingMember.location,
          photo_url: existingMember.photo_url,
          created_at: existingMember.created_at
        });
      }

      let photoUrl = null;
      if (req.file) {
        const uploadResult = await uploadCommunityPhoto(
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype
        );
        photoUrl = uploadResult.url;
      }

      let memberId;
      let found = false;
      for (let i = 0; i < 10; i++) {
        memberId = generateMemberId();
        const existing = await db.get('SELECT member_id FROM community_members WHERE member_id = ?', [memberId]);
        if (!existing) { found = true; break; }
      }
      if (!found) {
        return res.status(500).json({ error: 'Could not generate a unique member ID. Please try again.' });
      }

      await db.run(`
        INSERT INTO community_members (member_id, name, phone, location, photo_url)
        VALUES (?, ?, ?, ?, ?)
      `, [memberId, name, phone, location, photoUrl]);

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

router.get('/community/member/:memberId', async (req, res, next) => {
  try {
    const db = getDb();
    const id = (req.params.memberId || '').trim().toUpperCase();
    const row = await db.get(`
      SELECT member_id, name, phone, location, photo_url, created_at 
      FROM community_members 
      WHERE member_id = ?
    `, [id]);

    if (!row) {
      return res.status(404).json({ error: 'Member not found. Please check your Member ID.' });
    }

    res.json(row);
  } catch (err) {
    next(err);
  }
});

export default router;
