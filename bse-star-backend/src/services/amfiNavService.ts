/**
 * Tanashvi Fintech B2B Mutual Fund Platform
 * AMFI Open NAV & Scheme Master Synchronization Service
 * 
 * Enshrines the Core Mandate:
 * Zero Live Dependency (Offline/Mock-First): Parses daily AMFI NAV feeds
 * with safe offline fallback to pre-bundled seed fixtures if external network
 * is unavailable or during local offline testing.
 */

import fs from 'fs';
import path from 'path';
import { DatabaseService } from '../database/db.js';

export interface AmfiSchemeRecord {
  amfiCode: string;
  isinGrowth: string;
  isinReinvest?: string;
  schemeName: string;
  nav: number;
  navDate: string; // YYYY-MM-DD
  amcName: string;
  category: string;
  broadCategory: 'Equity' | 'Debt' | 'Hybrid' | 'Solution Oriented' | 'Other';
  subCategory: string;
  plan: 'Direct' | 'Regular';
  option: 'Growth' | 'IDCW';
  cutoffTime: '13:30:00' | '15:00:00';
  schemeBseCode: string; // Mapped canonical identifier
}

export interface AmfiSyncSummary {
  totalParsed: number;
  uniqueAmcs: number;
  categoriesFound: string[];
  dbRecordsUpdated: number;
  navDate: string;
  source: 'LIVE_AMFI_HTTP' | 'LOCAL_SEED_FIXTURE';
}

export class AmfiNavService {
  private static instance: AmfiNavService;

  private schemesByAmfiCode = new Map<string, AmfiSchemeRecord>();
  private schemesByIsin = new Map<string, AmfiSchemeRecord>();
  private lastSyncSummary: AmfiSyncSummary | null = null;

  public static readonly AMFI_PUBLIC_URL = 'https://www.amfiindia.com/spages/NAVAll.txt';

  public static getInstance(): AmfiNavService {
    if (!AmfiNavService.instance) {
      AmfiNavService.instance = new AmfiNavService();
    }
    return AmfiNavService.instance;
  }

  /**
   * Fetches raw AMFI NAVAll text data, with graceful offline fallback to local seed fixture.
   */
  public async fetchRawNavData(options?: { forceLive?: boolean; timeoutMs?: number }): Promise<{ text: string; source: 'LIVE_AMFI_HTTP' | 'LOCAL_SEED_FIXTURE' }> {
    const timeoutMs = options?.timeoutMs || 4000;

    if (options?.forceLive) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        const res = await fetch(AmfiNavService.AMFI_PUBLIC_URL, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (res.ok) {
          const text = await res.text();
          if (text.length > 500) {
            return { text, source: 'LIVE_AMFI_HTTP' };
          }
        }
      } catch (err: any) {
        console.warn(`⚠️  AMFI Live HTTP fetch timed out or failed (${err.message}). Falling back to local seed fixture.`);
      }
    }

    // Load from local seed fixture
    const fixturePaths = [
      path.join(__dirname, '..', 'fixtures', 'amfi_nav_sample.txt'),
      path.join(__dirname, 'fixtures', 'amfi_nav_sample.txt'),
      path.resolve('src/fixtures/amfi_nav_sample.txt'),
      path.resolve('bse-star-backend/src/fixtures/amfi_nav_sample.txt')
    ];

    for (const p of fixturePaths) {
      if (fs.existsSync(p)) {
        const text = fs.readFileSync(p, 'utf-8');
        return { text, source: 'LOCAL_SEED_FIXTURE' };
      }
    }

    throw new Error('Could not locate local AMFI NAV seed fixture');
  }

  /**
   * Parses standard AMFI NAVAll semicolon-delimited text into structured records.
   */
  public parseFeed(rawText: string): AmfiSchemeRecord[] {
    const lines = rawText.split(/\r?\n/);
    const records: AmfiSchemeRecord[] = [];

    let currentCategory = 'Other';
    let currentAmc = 'Unknown AMC';

    for (let line of lines) {
      line = line.trim();
      if (!line) continue;

      // Category Header Line, e.g.: "Open Ended Schemes ( Equity Scheme - Large Cap Fund )"
      if (line.startsWith('Open Ended Schemes') || line.startsWith('Close Ended Schemes') || line.startsWith('Interval Fund Schemes')) {
        const match = line.match(/\((.*?)\)/);
        if (match && match[1]) {
          currentCategory = match[1].trim();
        } else {
          currentCategory = line;
        }
        continue;
      }

      // AMC Header Line (does not contain semicolons and ends with "Mutual Fund")
      if (!line.includes(';') && (line.includes('Mutual Fund') || line.includes('Asset Management'))) {
        currentAmc = line.trim();
        continue;
      }

      // Data Line: Scheme Code;ISIN Div Payout/ ISIN Growth;ISIN Div Reinvestment;Scheme Name;Net Asset Value;Date
      const parts = line.split(';');
      if (parts.length >= 6) {
        const amfiCode = parts[0].trim();
        const isinGrowth = parts[1].trim();
        const isinReinvest = parts[2]?.trim() || undefined;
        const schemeName = parts[3].trim();
        const navStr = parts[4].trim();
        const rawDate = parts[5].trim();

        const nav = parseFloat(navStr);
        if (isNaN(nav) || !amfiCode || !schemeName) continue;

        // Parse Date: format is usually DD-Mon-YYYY (e.g. 31-Oct-2026)
        let navDate = new Date().toISOString().split('T')[0];
        try {
          const parsed = new Date(rawDate);
          if (!isNaN(parsed.getTime())) {
            navDate = parsed.toISOString().split('T')[0];
          }
        } catch {
          // fallback to today
        }

        // Determine plan
        const plan: 'Direct' | 'Regular' = schemeName.toLowerCase().includes('direct') ? 'Direct' : 'Regular';

        // Determine option
        const option: 'Growth' | 'IDCW' = schemeName.toLowerCase().includes('growth') ? 'Growth' : 'IDCW';

        // Determine broad category
        let broadCategory: 'Equity' | 'Debt' | 'Hybrid' | 'Solution Oriented' | 'Other' = 'Other';
        const catLower = currentCategory.toLowerCase();
        if (catLower.includes('equity') || catLower.includes('elss')) {
          broadCategory = 'Equity';
        } else if (catLower.includes('debt') || catLower.includes('liquid') || catLower.includes('overnight')) {
          broadCategory = 'Debt';
        } else if (catLower.includes('hybrid')) {
          broadCategory = 'Hybrid';
        } else if (catLower.includes('solution')) {
          broadCategory = 'Solution Oriented';
        }

        // Determine SEBI statutory cut-off time
        // Liquid & Overnight: 13:30:00 IST | Equity & Debt: 15:00:00 IST
        const cutoffTime: '13:30:00' | '15:00:00' =
          catLower.includes('liquid') || catLower.includes('overnight') ? '13:30:00' : '15:00:00';

        // Canonical BSE Code: use ISIN or AMFI code as canonical code
        const schemeBseCode = isinGrowth && isinGrowth !== '-' ? isinGrowth : `AMFI-${amfiCode}`;

        records.push({
          amfiCode,
          isinGrowth,
          isinReinvest,
          schemeName,
          nav,
          navDate,
          amcName: currentAmc,
          category: currentCategory,
          broadCategory,
          subCategory: currentCategory,
          plan,
          option,
          cutoffTime,
          schemeBseCode
        });
      }
    }

    return records;
  }

  /**
   * Synchronizes schemes into internal memory catalog and optional PostgreSQL database.
   */
  public async syncSchemes(options?: { forceLive?: boolean; persistToDb?: boolean }): Promise<AmfiSyncSummary> {
    const { text, source } = await this.fetchRawNavData({ forceLive: options?.forceLive });
    const records = this.parseFeed(text);

    const amcs = new Set<string>();
    const categories = new Set<string>();
    let latestDate = '';

    // Index into in-memory storage for instant offline queries
    for (const r of records) {
      this.schemesByAmfiCode.set(r.amfiCode, r);
      if (r.isinGrowth && r.isinGrowth !== '-') {
        this.schemesByIsin.set(r.isinGrowth, r);
      }
      amcs.add(r.amcName);
      categories.add(r.category);
      if (r.navDate > latestDate) latestDate = r.navDate;
    }

    let dbRecordsUpdated = 0;

    // Optional PostgreSQL persistence if database is available
    if (options?.persistToDb) {
      try {
        const pool = DatabaseService.getPool();
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          for (const r of records.slice(0, 100)) { // batch upsert
            await client.query(`
              INSERT INTO tanashvi_core.master_schemes (
                scheme_bse_code, scheme_isin, scheme_amfi_code, name,
                scheme_amc_code, scheme_amc_name, scheme_rta_code, scheme_rta_name,
                scheme_plan, scheme_option, scheme_category, scheme_sub_category,
                cutoff_time, last_synced_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP)
              ON CONFLICT (scheme_bse_code) DO UPDATE SET
                name = EXCLUDED.name,
                scheme_plan = EXCLUDED.scheme_plan,
                scheme_option = EXCLUDED.scheme_option,
                last_synced_at = CURRENT_TIMESTAMP;
            `, [
              r.schemeBseCode,
              r.isinGrowth,
              r.amfiCode,
              r.schemeName,
              r.amcName.slice(0, 10).toUpperCase(),
              r.amcName,
              'CAMS',
              'CAMS',
              r.plan,
              r.option,
              r.broadCategory,
              r.subCategory,
              r.cutoffTime
            ]);
            dbRecordsUpdated++;
          }
          await client.query('COMMIT');
        } catch (dbErr: any) {
          await client.query('ROLLBACK');
          console.warn(`Database upsert skipped: ${dbErr.message}`);
        } finally {
          client.release();
        }
      } catch (err: any) {
        // DB not running, perfectly fine in mock/offline mode
      }
    }

    this.lastSyncSummary = {
      totalParsed: records.length,
      uniqueAmcs: amcs.size,
      categoriesFound: Array.from(categories),
      dbRecordsUpdated,
      navDate: latestDate || new Date().toISOString().split('T')[0],
      source
    };

    return this.lastSyncSummary;
  }

  /**
   * Search catalog by scheme name, AMC, category, or plan.
   */
  public searchSchemes(options: {
    query?: string;
    category?: string;
    amc?: string;
    plan?: 'Direct' | 'Regular';
    limit?: number;
  }): AmfiSchemeRecord[] {
    const { query = '', category, amc, plan, limit = 20 } = options;
    const qLower = query.toLowerCase().trim();

    const matches: AmfiSchemeRecord[] = [];

    for (const scheme of this.schemesByAmfiCode.values()) {
      if (qLower) {
        const matchesName = scheme.schemeName.toLowerCase().includes(qLower);
        const matchesAmc = scheme.amcName.toLowerCase().includes(qLower);
        const matchesCode = scheme.amfiCode.includes(qLower) || scheme.isinGrowth.toLowerCase().includes(qLower);
        if (!matchesName && !matchesAmc && !matchesCode) continue;
      }

      if (category && !scheme.category.toLowerCase().includes(category.toLowerCase())) {
        continue;
      }

      if (amc && !scheme.amcName.toLowerCase().includes(amc.toLowerCase())) {
        continue;
      }

      if (plan && scheme.plan !== plan) {
        continue;
      }

      matches.push(scheme);
      if (matches.length >= limit) break;
    }

    return matches;
  }

  /**
   * Get single scheme by AMFI code or ISIN.
   */
  public getScheme(codeOrIsin: string): AmfiSchemeRecord | undefined {
    return this.schemesByAmfiCode.get(codeOrIsin) || this.schemesByIsin.get(codeOrIsin);
  }

  public getLastSyncSummary(): AmfiSyncSummary | null {
    return this.lastSyncSummary;
  }

  public getAllCategories(): string[] {
    const cats = new Set<string>();
    for (const s of this.schemesByAmfiCode.values()) {
      cats.add(s.category);
    }
    return Array.from(cats).sort();
  }
}

