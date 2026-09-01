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

router.get('/dashboard', requireRole(ROLES.ALL_ADMINS), async (req, res, next) => {
  try {
    const db = getDb();

    const [
      oppsCount,
      pubOppsCount,
      eventsCount,
      pubEventsCount,
      annCount,
      pubAnnCount,
      testCount,
      pubTestCount,
      faqsCount,
      appsCount,
      membersCount,
      appsByStatus,
      appsByRole,
      recentAudit,
      recentApplications,
      upcomingEvents,
    ] = await Promise.all([
      db.get('SELECT COUNT(*) as count FROM opportunities'),
      db.get('SELECT COUNT(*) as count FROM opportunities WHERE is_published = 1'),
      db.get('SELECT COUNT(*) as count FROM events'),
      db.get('SELECT COUNT(*) as count FROM events WHERE is_published = 1'),
      db.get('SELECT COUNT(*) as count FROM announcements'),
      db.get('SELECT COUNT(*) as count FROM announcements WHERE is_published = 1'),
      db.get('SELECT COUNT(*) as count FROM testimonials'),
      db.get('SELECT COUNT(*) as count FROM testimonials WHERE is_published = 1'),
      db.get('SELECT COUNT(*) as count FROM faqs'),
      db.get('SELECT COUNT(*) as count FROM application_records'),
      db.get('SELECT COUNT(*) as count FROM community_members'),
      db.all('SELECT status, COUNT(*) as count FROM application_records GROUP BY status'),
      db.all('SELECT role, COUNT(*) as count FROM application_records GROUP BY role'),
      db.all(`
        SELECT id, admin_email, action, resource_type, resource_id, created_at
        FROM audit_logs ORDER BY created_at DESC LIMIT 10
      `),
      db.all(`
        SELECT id, applicant_name, email, role, status, applied_date, created_at
        FROM application_records ORDER BY created_at DESC LIMIT 5
      `),
      db.all(`
        SELECT id, title, slug, category, event_date, location, is_online
        FROM events WHERE is_published = 1 AND event_date >= date('now')
        ORDER BY event_date ASC LIMIT 5
      `),
    ]);

    const stats = {
      opportunities: oppsCount?.count || 0,
      publishedOpportunities: pubOppsCount?.count || 0,
      events: eventsCount?.count || 0,
      publishedEvents: pubEventsCount?.count || 0,
      announcements: annCount?.count || 0,
      publishedAnnouncements: pubAnnCount?.count || 0,
      testimonials: testCount?.count || 0,
      publishedTestimonials: pubTestCount?.count || 0,
      faqs: faqsCount?.count || 0,
      applications: appsCount?.count || 0,
      communityMembers: membersCount?.count || 0,
      applicationsByStatus: appsByStatus || [],
      applicationsByRole: appsByRole || [],
    };

    res.json({ stats, recentAudit, recentApplications, upcomingEvents });
  } catch (err) {
    next(err);
  }
});

router.get('/security', requireRole(ROLES.ALL_ADMINS), async (req, res, next) => {
  try {
    const db = getDb();
    
    const [admin, activeSessions, recentFailedLogins, recentActions] = await Promise.all([
      db.get(`
        SELECT id, email, name, role, is_active, last_login, failed_attempts, locked_until, created_at, updated_at
        FROM admins WHERE id = ?
      `, [req.admin.id]),
      db.all(`
        SELECT id, ip, user_agent, expires_at, created_at
        FROM admin_sessions
        WHERE admin_id = ? AND expires_at > datetime('now')
        ORDER BY created_at DESC
      `, [req.admin.id]),
      db.all(`
        SELECT id, action, metadata, ip, user_agent, created_at
        FROM audit_logs
        WHERE admin_id = ? AND action = 'LOGIN_FAILED'
        ORDER BY created_at DESC LIMIT 10
      `, [req.admin.id]),
      db.all(`
        SELECT id, action, resource_type, resource_id, ip, created_at
        FROM audit_logs
        WHERE admin_id = ?
        ORDER BY created_at DESC LIMIT 20
      `, [req.admin.id]),
    ]);

    res.json({
      account: {
        ...admin,
        is_active: Boolean(admin?.is_active),
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

router.get('/admins', requireRole(ROLES.SUPER_ADMIN), async (req, res, next) => {
  try {
    const db = getDb();
    const rows = await db.all(`
      SELECT id, email, name, role, is_active, last_login, created_at, updated_at
      FROM admins ORDER BY created_at ASC
    `);
    const admins = rows.map((a) => ({ ...a, is_active: Boolean(a.is_active) }));
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
