/**
 * BSE StAR MF v2.0 - Header Injection and Request Context Service
 * 
 * Sets up mandatory headers for BSE StAR MF v2 API Gateway:
 * - Content-Type: application/jose
 * - X-API-Org-ID: member/<memberCode>:<fingerprint>
 * - Authorization: Bearer <token>
 * - X-STARMFv2-Trace-ID: <uuid>
 * 
 * Configured with Tanashvi Fintech Private Limited Member Code (714114)
 */

import { v4 as uuidv4 } from 'uuid';

export interface BseHeaderConfig {
  memberCode: string;
  fingerprint: string;
  accessToken?: string | null;
  traceId?: string;
  isLoginRequest?: boolean;
}

export interface BseRequestHeaders {
  'Content-Type': 'application/jose';
  'X-API-Org-ID': string;
  'X-STARMFv2-Trace-ID': string;
  'Authorization'?: string;
  [key: string]: string | undefined;
}

export class BseHeaderService {
  public static readonly DEFAULT_MEMBER_CODE = process.env.BSE_MEMBER_CODE || '714114';
  public static readonly DEFAULT_FINGERPRINT = process.env.BSE_MEMBER_FINGERPRINT || 'BSE_FINGERPRINT_PLACEHOLDER_CHECKSUM';

  /**
   * Builds the official BSE StAR MF v2 compliant headers object.
   * 
   * @param config Optional overrides for memberCode, fingerprint, token, or traceId
   * @returns BseRequestHeaders object ready for Axios/Fetch
   */
  public static buildHeaders(config?: Partial<BseHeaderConfig>): BseRequestHeaders {
    const memberCode = config?.memberCode || this.DEFAULT_MEMBER_CODE;
    const fingerprint = config?.fingerprint || this.DEFAULT_FINGERPRINT;
    const traceId = config?.traceId || uuidv4();

    // BSE standard format: member/<member_code>:<fingerprint>
    const orgIdHeader = `member/${memberCode}:${fingerprint}`;

    const headers: BseRequestHeaders = {
      'Content-Type': 'application/jose',
      'X-API-Org-ID': orgIdHeader,
      'X-STARMFv2-Trace-ID': traceId
    };

    if (config?.accessToken && !config.isLoginRequest) {
      headers['Authorization'] = `Bearer ${config.accessToken}`;
    }

    return headers;
  }

  /**
   * Formats the X-API-Org-ID header string explicitly.
   */
  public static formatOrgIdHeader(memberCode: string, fingerprint: string): string {
    return `member/${memberCode}:${fingerprint}`;
  }
}

