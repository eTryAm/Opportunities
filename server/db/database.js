import { createClient } from '@libsql/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import config from '../config.js';
import { seedDatabase } from './seed.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let client = null;
let db = null;

function createDbWrapper(clientInstance) {
  return {
    raw: clientInstance,

    async all(sql, params = []) {
      const rs = await clientInstance.execute({
        sql,
        args: Array.isArray(params) ? params : [params],
      });
      return rs.rows.map((row) => ({ ...row }));
    },

    async get(sql, params = []) {
      const rs = await clientInstance.execute({
        sql,
        args: Array.isArray(params) ? params : [params],
      });
      return rs.rows[0] ? { ...rs.rows[0] } : null;
    },

    async run(sql, params = []) {
      const rs = await clientInstance.execute({
        sql,
        args: Array.isArray(params) ? params : [params],
      });
      return {
        lastInsertRowid: rs.lastInsertRowid != null ? Number(rs.lastInsertRowid) : undefined,
        changes: rs.rowsAffected || 0,
        rowsAffected: rs.rowsAffected || 0,
      };
    },

    async exec(sql) {
      if (typeof clientInstance.executeMultiple === 'function') {
        return await clientInstance.executeMultiple(sql);
      }
      const stmts = sql
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      for (const stmt of stmts) {
        await clientInstance.execute(stmt);
      }
    },

    async batch(statements, mode = 'deferred') {
      return await clientInstance.batch(statements, mode);
    },

    prepare(sql) {
      return {
        all: async (...args) => {
          const params = args.length === 1 && Array.isArray(args[0]) ? args[0] : args;
          return this.all(sql, params);
        },
        get: async (...args) => {
          const params = args.length === 1 && Array.isArray(args[0]) ? args[0] : args;
          return this.get(sql, params);
        },
        run: async (...args) => {
          const params = args.length === 1 && Array.isArray(args[0]) ? args[0] : args;
          return this.run(sql, params);
        },
      };
    },
  };
}

export function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

export async function initDatabase() {
  if (db) return db;

  const isTurso = Boolean(config.tursoDatabaseUrl && config.tursoDatabaseUrl.startsWith('libsql'));
  let url = config.tursoDatabaseUrl;

  if (!isTurso && !url) {
    const dbDir = path.dirname(config.dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    // Format for local file with @libsql/client
    const normalizedPath = config.dbPath.replace(/\\/g, '/');
    url = `file:${normalizedPath}`;
  }

  client = createClient({
    url,
    authToken: isTurso ? config.tursoAuthToken : undefined,
  });

  db = createDbWrapper(client);

  try {
    // Run schema migrations/DDL
    const schemaFile = path.join(__dirname, 'schema.sql');
    if (fs.existsSync(schemaFile)) {
      const schema = fs.readFileSync(schemaFile, 'utf-8');
      await db.exec(schema);
    }

    // Check if initial admin seeding is needed
    const adminCheck = await db.get('SELECT COUNT(*) as count FROM admins');
    if (!adminCheck || adminCheck.count === 0) {
      await seedDatabase(db);
    }

    console.log(`Database connected successfully (${isTurso ? 'Turso' : 'Local SQLite'}).`);
  } catch (err) {
    console.error('Database initialization error:', err);
    throw err;
  }

  return db;
}

export function closeDatabase() {
  if (client) {
    try {
      client.close();
    } catch {
      // Ignore close errors during shutdown
    }
    client = null;
    db = null;
  }
}
