import Database from 'better-sqlite3';
import { createClient } from '@libsql/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const LOCAL_DB_PATH = process.env.DB_PATH || path.resolve(__dirname, '../server/db/yeh.db');
const TURSO_URL = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL;
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;

async function migrate() {
  console.log('\n======================================================');
  console.log('  Youth Empowerment Hub — Turso Database Migration');
  console.log('======================================================\n');

  if (!TURSO_URL) {
    console.error('❌ Error: TURSO_DATABASE_URL is not set in your .env file or environment.');
    console.error('Please set TURSO_DATABASE_URL (e.g. libsql://your-db-name.turso.io) and TURSO_AUTH_TOKEN.\n');
    process.exit(1);
  }

  if (!fs.existsSync(LOCAL_DB_PATH)) {
    console.warn(`⚠️ Warning: Local SQLite database not found at ${LOCAL_DB_PATH}.`);
    console.log('Creating fresh schema on Turso instead...\n');
  }

  console.log(`📍 Source: ${LOCAL_DB_PATH}`);
  console.log(`🎯 Target: ${TURSO_URL}\n`);

  // 1. Connect to target Turso database
  const target = createClient({
    url: TURSO_URL,
    authToken: TURSO_TOKEN,
  });

  try {
    // 2. Execute schema on target
    console.log('🔨 Applying schema to target database...');
    const schemaFile = path.resolve(__dirname, '../server/db/schema.sql');
    const schema = fs.readFileSync(schemaFile, 'utf-8');
    
    if (typeof target.executeMultiple === 'function') {
      await target.executeMultiple(schema);
    } else {
      const stmts = schema.split(';').map(s => s.trim()).filter(Boolean);
      for (const stmt of stmts) {
        await target.execute(stmt);
      }
    }
    console.log('✅ Schema successfully created/verified on target database.\n');

    // 3. Migrate data from local SQLite if available
    if (fs.existsSync(LOCAL_DB_PATH)) {
      const source = new Database(LOCAL_DB_PATH, { readonly: true });
      const tables = [
        'admins',
        'admin_sessions',
        'audit_logs',
        'form_links',
        'site_settings',
        'opportunities',
        'events',
        'announcements',
        'testimonials',
        'faqs',
        'application_records',
        'impact_statistics',
        'social_links',
        'campus_ambassador_settings',
        'community_members',
      ];

      console.log('📦 Transferring tables & records...');
      console.log('------------------------------------------------------');

      for (const table of tables) {
        try {
          const rows = source.prepare(`SELECT * FROM ${table}`).all();
          if (rows.length === 0) {
            console.log(`  ⚪ ${table.padEnd(28)}: 0 records (empty)`);
            continue;
          }

          const columns = Object.keys(rows[0]);
          const placeholders = columns.map(() => '?').join(', ');
          const sql = `INSERT OR REPLACE INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;

          for (const row of rows) {
            const values = columns.map(col => row[col]);
            await target.execute({ sql, args: values });
          }

          // Verify count on target
          const targetCountRs = await target.execute(`SELECT COUNT(*) as count FROM ${table}`);
          const targetCount = targetCountRs.rows[0]?.count ?? 'unknown';

          console.log(`  ✅ ${table.padEnd(28)}: ${rows.length} migrated (target count: ${targetCount})`);
        } catch (tableErr) {
          console.warn(`  ⚠️ ${table.padEnd(28)}: Error (${tableErr.message})`);
        }
      }
      source.close();
    }

    console.log('\n======================================================');
    console.log('🎉 Migration Completed Successfully!');
    console.log('======================================================\n');
  } catch (err) {
    console.error('\n❌ Migration failed:', err);
    process.exit(1);
  } finally {
    target.close();
  }
}

migrate();
