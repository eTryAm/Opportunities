import { Router } from 'express';
import { getDb } from '../db/database.js';
import { authenticate, requireRole, ROLES } from '../middleware/auth.js';
import formLinksRouter from './formLinks.js';
import opportunitiesRouter from './opportunities.js';
import eventsRouter from './events.js';
import announcementsRouter from './announcements.js';
import testimonialsRouter from './testimonials.js';
import faqsRouter from './faqs.js';
import settingsRouter from './settings.js';
import applicationsRouter from './applications.js';
import auditLogsRouter from './auditLogs.js';
import communityMembersRouter from './communityMembers.js';

const router = Router();

router.use(authenticate);

router.get('/dashboard', requireRole(ROLES.ALL_ADMINS), (req, res, next) => {
  try {
    const db = getDb();

    const stats = {
      opportunities: db.prepare('SELECT COUNT(*) as count FROM opportunities').get().count,
      publishedOpportunities: db.prepare('SELECT COUNT(*) as count FROM opportunities WHERE is_published = 1').get().count,
      events: db.prepare('SELECT COUNT(*) as count FROM events').get().count,
      publishedEvents: db.prepare("SELECT COUNT(*) as count FROM events WHERE is_published = 1").get().count,
      announcements: db.prepare('SELECT COUNT(*) as count FROM announcements').get().count,
      publishedAnnouncements: db.prepare('SELECT COUNT(*) as count FROM announcements WHERE is_published = 1').get().count,
      testimonials: db.prepare('SELECT COUNT(*) as count FROM testimonials').get().count,
      publishedTestimonials: db.prepare('SELECT COUNT(*) as count FROM testimonials WHERE is_published = 1').get().count,
      faqs: db.prepare('SELECT COUNT(*) as count FROM faqs').get().count,
      applications: db.prepare('SELECT COUNT(*) as count FROM application_records').get().count,
      communityMembers: db.prepare('SELECT COUNT(*) as count FROM community_members').get().count,
      applicationsByStatus: db.prepare(`
        SELECT status, COUNT(*) as count FROM application_records GROUP BY status
      `).all(),
      applicationsByRole: db.prepare(`
        SELECT role, COUNT(*) as count FROM application_records GROUP BY role
      `).all(),
    };

    const recentAudit = db.prepare(`
      SELECT id, admin_email, action, resource_type, resource_id, created_at
      FROM audit_logs ORDER BY created_at DESC LIMIT 10
    `).all();

    const recentApplications = db.prepare(`
      SELECT id, applicant_name, email, role, status, applied_date, created_at
      FROM application_records ORDER BY created_at DESC LIMIT 5
    `).all();

    const upcomingEvents = db.prepare(`
      SELECT id, title, slug, category, event_date, location, is_online
      FROM events WHERE is_published = 1 AND event_date >= date('now')
      ORDER BY event_date ASC LIMIT 5
    `).all();

    res.json({ stats, recentAudit, recentApplications, upcomingEvents });
  } catch (err) {
    next(err);
  }
});

router.get('/security', requireRole(ROLES.ALL_ADMINS), (req, res, next) => {
  try {
    const db = getDb();
    const admin = db.prepare(`
      SELECT id, email, name, role, is_active, last_login, failed_attempts, locked_until, created_at, updated_at
      FROM admins WHERE id = ?
    `).get(req.admin.id);

    const activeSessions = db.prepare(`
      SELECT id, ip, user_agent, expires_at, created_at
      FROM admin_sessions
      WHERE admin_id = ? AND expires_at > datetime('now')
      ORDER BY created_at DESC
    `).all(req.admin.id);

    const recentFailedLogins = db.prepare(`
      SELECT id, action, metadata, ip, user_agent, created_at
      FROM audit_logs
      WHERE admin_id = ? AND action = 'LOGIN_FAILED'
      ORDER BY created_at DESC LIMIT 10
    `).all(req.admin.id);

    const recentActions = db.prepare(`
      SELECT id, action, resource_type, resource_id, ip, created_at
      FROM audit_logs
      WHERE admin_id = ?
      ORDER BY created_at DESC LIMIT 20
    `).all(req.admin.id);

    res.json({
      account: {
        ...admin,
        is_active: Boolean(admin.is_active),
      },
      activeSessions,
      recentFailedLogins: recentFailedLogins.map((log) => ({
        ...log,
        metadata: log.metadata ? JSON.parse(log.metadata) : null,
      })),
      recentActions,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/admins', requireRole(ROLES.SUPER_ADMIN), (req, res, next) => {
  try {
    const db = getDb();
    const admins = db.prepare(`
      SELECT id, email, name, role, is_active, last_login, created_at, updated_at
      FROM admins ORDER BY created_at ASC
    `).all().map((a) => ({ ...a, is_active: Boolean(a.is_active) }));
    res.json(admins);
  } catch (err) {
    next(err);
  }
});

router.use('/form-links', formLinksRouter);
router.use('/opportunities', opportunitiesRouter);
router.use('/events', eventsRouter);
router.use('/announcements', announcementsRouter);
router.use('/testimonials', testimonialsRouter);
router.use('/faqs', faqsRouter);
router.use('/settings', settingsRouter);
router.use('/applications', applicationsRouter);
router.use('/community-members', communityMembersRouter);
router.use('/audit-logs', auditLogsRouter);

export default router;
