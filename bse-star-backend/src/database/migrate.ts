/**
 * Tanashvi Fintech B2B Mutual Fund Platform
 * PostgreSQL Database Migration Runner
 */

import fs from 'fs';
import path from 'path';
import { pool } from './db.js';

async function runMigrations() {
  console.log('========================================================================');
  console.log('🐘 Tanashvi Mutual Fund Platform - Database Migration Runner');
  console.log('========================================================================\n');

  const client = await pool.connect();

  try {
    // 1. Ensure migrations tracking table exists
    await client.query(`
      CREATE SCHEMA IF NOT EXISTS tanashvi_core;
      CREATE TABLE IF NOT EXISTS tanashvi_core.schema_migrations (
        id SERIAL PRIMARY KEY,
        migration_name VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Locate migrations directory
    let migrationsDir = path.join(__dirname, 'migrations');
    if (!fs.existsSync(migrationsDir)) {
      migrationsDir = path.join(__dirname, '..', 'src', 'database', 'migrations');
    }
    if (!fs.existsSync(migrationsDir)) {
      migrationsDir = path.resolve('src/database/migrations');
    }

    if (!fs.existsSync(migrationsDir)) {
      throw new Error(`Migrations directory not found at ${migrationsDir}`);
    }

    console.log(`📁 Scanning migrations in: ${migrationsDir}`);
    const files = fs.readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    console.log(`📋 Found ${files.length} migration files.\n`);

    // 3. Fetch already applied migrations
    const appliedResult = await client.query('SELECT migration_name FROM tanashvi_core.schema_migrations');
    const appliedSet = new Set(appliedResult.rows.map((r) => r.migration_name));

    // 4. Apply pending migrations sequentially
    for (const file of files) {
      if (appliedSet.has(file)) {
        console.log(`   ⏩ Skipping ${file} (already applied)`);
        continue;
      }

      console.log(`   ⚡ Applying ${file}...`);
      const filePath = path.join(migrationsDir, file);
      const sqlContent = fs.readFileSync(filePath, 'utf-8');

      await client.query('BEGIN');
      try {
        await client.query(sqlContent);
        await client.query(
          'INSERT INTO tanashvi_core.schema_migrations (migration_name) VALUES ($1)',
          [file]
        );
        await client.query('COMMIT');
        console.log(`   ✅ Successfully applied ${file}\n`);
      } catch (err: any) {
        await client.query('ROLLBACK');
        console.error(`   ❌ Failed applying ${file}:`, err.message);
        throw err;
      }
    }

    console.log('========================================================================');
    console.log('🎉 ALL DATABASE MIGRATIONS APPLIED SUCCESSFULLY');
    console.log('========================================================================');
  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run if executed directly
if (typeof require !== 'undefined' && require.main === module) {
  runMigrations();
}

export { runMigrations };
