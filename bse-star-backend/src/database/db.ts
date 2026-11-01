/**
 * Tanashvi Fintech B2B Mutual Fund Platform
 * PostgreSQL Database Connection Pool & Tenant RLS Session Wrapper
 * 
 * Enforces PostgreSQL Row-Level Security (RLS):
 * Injects `SET LOCAL app.current_tenant_id = $1` before executing tenant queries.
 */

import { Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DATABASE_URL || 'postgresql://tanashvi_admin:tanashvi_secure_pass@localhost:5432/tanashvi_mf_platform?schema=tanashvi_core';

export const pool = new Pool({
  connectionString,
  max: parseInt(process.env.DB_POOL_MAX || '20', 10),
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT_MS || '30000', 10),
  connectionTimeoutMillis: 5000
});

export class DatabaseService {
  public static getPool(): Pool {
    return pool;
  }

  /**
   * Executes a database operation within an isolated tenant transaction,
   * setting the PostgreSQL session variable for Row-Level Security (RLS).
   */
  public static async withTenantTransaction<T>(
    tenantId: string,
    callback: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      // Set RLS tenant variable for current transaction
      await client.query('SET LOCAL app.current_tenant_id = $1', [tenantId]);
      
      const result = await callback(client);
      
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Executes a database query as SuperAdmin (bypassing RLS tenant restrictions).
   */
  public static async withAdminTransaction<T>(
    callback: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query("SET LOCAL app.is_super_admin = 'true'");
      
      const result = await callback(client);
      
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

