import { Router } from 'express';
import { getDb } from '../db/database.js';
import config from '../config.js';
import { loginRateLimiter } from '../middleware/rateLimit.js';
import { loginValidation, changePasswordValidation } from '../middleware/validate.js';
import {
  authenticate,
  createSession,
  storeSession,
  revokeSession,
  revokeAllSessions,
  setAuthCookie,
  clearAuthCookie,
} from '../middleware/auth.js';
import { hashPassword, verifyPassword, validatePasswordStrength } from '../utils/password.js';
import { logAudit, getClientMeta } from '../utils/audit.js';

const router = Router();

router.post('/login', loginRateLimiter, loginValidation, async (req, res, next) => {
  try {
    const { email, password, remember = false } = req.body;
    const db = getDb();
    const { ip, userAgent } = getClientMeta(req);

    const admin = db.prepare('SELECT * FROM admins WHERE email = ?').get(email.toLowerCase());

    if (!admin) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (!admin.is_active) {
      return res.status(403).json({ error: 'Account is deactivated. Contact a super admin.' });
    }

    if (admin.locked_until && new Date(admin.locked_until) > new Date()) {
      return res.status(423).json({
        error: 'Account temporarily locked due to failed login attempts.',
        lockedUntil: admin.locked_until,
      });
    }

    const valid = await verifyPassword(password, admin.password_hash);
    if (!valid) {
      const failedAttempts = admin.failed_attempts + 1;
      let lockedUntil = null;

      if (failedAttempts >= config.maxLoginAttempts) {
        lockedUntil = new Date(Date.now() + config.lockoutMinutes * 60 * 1000).toISOString();
      }

      db.prepare(`
        UPDATE admins SET failed_attempts = ?, locked_until = ?, updated_at = datetime('now') WHERE id = ?
      `).run(failedAttempts, lockedUntil, admin.id);

      logAudit({
        adminId: admin.id,
        adminEmail: admin.email,
        action: 'LOGIN_FAILED',
        resourceType: 'admin',
        resourceId: admin.id,
        metadata: { failedAttempts },
        ip,
        userAgent,
      });

      if (lockedUntil) {
        return res.status(423).json({
          error: 'Account locked due to too many failed attempts. Try again in 30 minutes.',
          lockedUntil,
        });
      }

      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    db.prepare(`
      UPDATE admins SET failed_attempts = 0, locked_until = NULL, last_login = datetime('now'), updated_at = datetime('now') WHERE id = ?
    `).run(admin.id);

    const { token, expiresAt } = createSession(admin, remember);
    storeSession(admin.id, token, ip, userAgent, expiresAt);
    setAuthCookie(res, token, remember);

    logAudit({
      adminId: admin.id,
      adminEmail: admin.email,
      action: 'LOGIN',
      resourceType: 'admin',
      resourceId: admin.id,
      ip,
      userAgent,
    });

    res.json({
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        lastLogin: admin.last_login,
      },
      token,
      expiresAt,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/logout', authenticate, (req, res, next) => {
  try {
    const { ip, userAgent } = getClientMeta(req);
    revokeSession(req.token);
    clearAuthCookie(res);

    logAudit({
      adminId: req.admin.id,
      adminEmail: req.admin.email,
      action: 'LOGOUT',
      resourceType: 'admin',
      resourceId: req.admin.id,
      ip,
      userAgent,
    });

    res.json({ message: 'Logged out successfully.' });
  } catch (err) {
    next(err);
  }
});

router.get('/me', authenticate, (req, res, next) => {
  try {
    const db = getDb();
    const admin = db.prepare(`
      SELECT id, email, name, role, is_active, last_login, created_at FROM admins WHERE id = ?
    `).get(req.admin.id);

    if (!admin) {
      return res.status(404).json({ error: 'Admin not found.' });
    }

    res.json({
      ...admin,
      is_active: Boolean(admin.is_active),
    });
  } catch (err) {
    next(err);
  }
});

router.post('/change-password', authenticate, changePasswordValidation, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const db = getDb();
    const { ip, userAgent } = getClientMeta(req);

    const admin = db.prepare('SELECT * FROM admins WHERE id = ?').get(req.admin.id);
    const valid = await verifyPassword(currentPassword, admin.password_hash);
    if (!valid) {
      return res.status(400).json({ error: 'Current password is incorrect.' });
    }

    const strength = validatePasswordStrength(newPassword);
    if (!strength.valid) {
      return res.status(400).json({ error: strength.message });
    }

    const passwordHash = await hashPassword(newPassword);
    db.prepare(`
      UPDATE admins SET password_hash = ?, updated_at = datetime('now') WHERE id = ?
    `).run(passwordHash, admin.id);

    logAudit({
      adminId: admin.id,
      adminEmail: admin.email,
      action: 'PASSWORD_CHANGED',
      resourceType: 'admin',
      resourceId: admin.id,
      ip,
      userAgent,
    });

    res.json({ message: 'Password changed successfully.' });
  } catch (err) {
    next(err);
  }
});

router.post('/revoke-sessions', authenticate, (req, res, next) => {
  try {
    const { ip, userAgent } = getClientMeta(req);
    revokeAllSessions(req.admin.id, req.token);

    logAudit({
      adminId: req.admin.id,
      adminEmail: req.admin.email,
      action: 'SESSIONS_REVOKED',
      resourceType: 'admin',
      resourceId: req.admin.id,
      metadata: { exceptCurrent: true },
      ip,
      userAgent,
    });

    res.json({ message: 'All other sessions have been revoked.' });
  } catch (err) {
    next(err);
  }
});

export default router;
