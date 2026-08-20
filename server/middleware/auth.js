import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import config from '../config.js';
import { getDb } from '../db/database.js';

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function extractToken(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  if (req.cookies && req.cookies[config.cookieName]) {
    return req.cookies[config.cookieName];
  }
  return null;
}

export function createSession(admin, remember = false) {
  const expiresIn = remember ? config.jwtRememberExpiresIn : config.jwtExpiresIn;
  const token = jwt.sign(
    { sub: admin.id, email: admin.email, role: admin.role },
    config.jwtSecret,
    { expiresIn }
  );

  const decoded = jwt.decode(token);
  const expiresAt = new Date(decoded.exp * 1000).toISOString();

  return { token, expiresAt, expiresIn };
}

export function storeSession(adminId, token, ip, userAgent, expiresAt) {
  const db = getDb();
  db.prepare(`
    INSERT INTO admin_sessions (admin_id, token_hash, ip, user_agent, expires_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(adminId, hashToken(token), ip, userAgent, expiresAt);
}

export function revokeSession(token) {
  const db = getDb();
  db.prepare('DELETE FROM admin_sessions WHERE token_hash = ?').run(hashToken(token));
}

export function revokeAllSessions(adminId, exceptToken = null) {
  const db = getDb();
  if (exceptToken) {
    db.prepare('DELETE FROM admin_sessions WHERE admin_id = ? AND token_hash != ?')
      .run(adminId, hashToken(exceptToken));
  } else {
    db.prepare('DELETE FROM admin_sessions WHERE admin_id = ?').run(adminId);
  }
}

export function cleanupExpiredSessions() {
  const db = getDb();
  db.prepare("DELETE FROM admin_sessions WHERE julianday(expires_at) < julianday('now')").run();
}

export function authenticate(req, res, next) {
  try {
    cleanupExpiredSessions();
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    try {
      jwt.verify(token, config.jwtSecret);
    } catch {
      return res.status(401).json({ error: 'Invalid or expired session.' });
    }

    const db = getDb();
    const session = db.prepare(`
      SELECT s.id AS session_id, s.token_hash, s.expires_at, a.id AS admin_id, a.email, a.name, a.role, a.is_active
      FROM admin_sessions s
      JOIN admins a ON a.id = s.admin_id
      WHERE s.token_hash = ? AND s.expires_at > datetime('now')
    `).get(hashToken(token));

    if (!session) {
      return res.status(401).json({ error: 'Session expired or revoked.' });
    }

    if (!session.is_active) {
      return res.status(403).json({ error: 'Account is deactivated.' });
    }

    req.admin = {
      id: session.admin_id,
      email: session.email,
      name: session.name,
      role: session.role,
    };
    req.token = token;
    next();
  } catch (err) {
    next(err);
  }
}

export function optionalAuth(req, res, next) {
  const token = extractToken(req);
  if (!token) return next();

  try {
    jwt.verify(token, config.jwtSecret);
    return authenticate(req, res, next);
  } catch {
    return next();
  }
}

export function requireRole(roles) {
  const allowed = Array.isArray(roles) ? roles : [roles];
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    if (!allowed.includes(req.admin.role)) {
      return res.status(403).json({ error: 'Insufficient permissions.' });
    }
    next();
  };
}

export const ROLES = {
  SUPER_ADMIN: ['SUPER_ADMIN'],
  CONTENT: ['SUPER_ADMIN', 'CONTENT_ADMIN'],
  OPPORTUNITIES: ['SUPER_ADMIN', 'OPPORTUNITY_ADMIN'],
  MODERATION: ['SUPER_ADMIN', 'CONTENT_ADMIN', 'OPPORTUNITY_ADMIN', 'MODERATOR'],
  ALL_ADMINS: ['SUPER_ADMIN', 'CONTENT_ADMIN', 'OPPORTUNITY_ADMIN', 'MODERATOR'],
};

export function setAuthCookie(res, token, remember = false) {
  const maxAge = remember
    ? 7 * 24 * 60 * 60 * 1000
    : config.sessionExpiryHours * 60 * 60 * 1000;

  res.cookie(config.cookieName, token, {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: config.cookieSameSite,
    maxAge,
    path: '/',
  });
}

export function clearAuthCookie(res) {
  res.clearCookie(config.cookieName, {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: config.cookieSameSite,
    path: '/',
  });
}
