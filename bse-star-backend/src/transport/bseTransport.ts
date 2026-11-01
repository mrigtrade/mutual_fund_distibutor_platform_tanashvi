/**
 * BSE StAR MF v2.0 - Transport Abstraction Layer
 * 
 * Complies with the Core Mandate:
 * Zero Live Dependency (Offline/Mock-First): Since BSE requires static IP whitelisting
 * before any inbound connection to their gateway is permitted, the entire platform
 * runs self-contained locally against simulated BSE responses by default, while
 * providing a seamless hot-toggle to live BSE HTTPS endpoints once whitelisted.
 * 
 * Developed for Tanashvi Fintech Private Limited (ARN-347849 / Member Code 714114)
 */

import { BseMockGateway, MockExchangeKeyPair } from '../mock/bseMockGateway.js';

export interface BseTransportConfig {
  mode: 'MOCK' | 'LIVE';
  liveBaseUrl?: string;
  memberCode: string;
  fingerprint: string;
  memberPublicKeyPem: string;
  memberPrivateKeyPem: string;
  bsePublicKeyPem: string;
}

export interface IBseTransport {
  getMode(): 'MOCK' | 'LIVE';
  sendEncryptedRequest(
    endpoint: string,
    encryptedJws: string,
    headers: Record<string, string | undefined>
  ): Promise<string>;
}

/**
 * Offline Simulator Transport:
 * Invokes the local in-memory BseMockGateway without making any network calls.
 */
export class BseSimulatorTransport implements IBseTransport {
  private mockGateway: BseMockGateway;
  private memberPublicKeyPem: string;

  constructor(config: {
    memberCode: string;
    fingerprint: string;
    memberPublicKeyPem: string;
    bseKeys?: MockExchangeKeyPair;
  }) {
    this.memberPublicKeyPem = config.memberPublicKeyPem;
    this.mockGateway = new BseMockGateway(
      { memberCode: config.memberCode, fingerprint: config.fingerprint },
      config.bseKeys
    );
  }

  public getMode(): 'MOCK' {
    return 'MOCK';
  }

  public getMockGateway(): BseMockGateway {
    return this.mockGateway;
  }

  public async sendEncryptedRequest(
    endpoint: string,
    encryptedJws: string,
    headers: Record<string, string | undefined>
  ): Promise<string> {
    return await this.mockGateway.handleEncryptedRequest(
      endpoint,
      encryptedJws,
      headers,
      this.memberPublicKeyPem
    );
  }
}

/**
 * Live BSE Gateway Transport:
 * Executes real HTTPS POST requests to the BSE StAR MF v2 gateway.
 * Activated only when BSE_GATEWAY_MODE=live and Static IP whitelisting is confirmed.
 */
export class BseHttpLiveTransport implements IBseTransport {
  private baseUrl: string;

  constructor(baseUrl: string = 'https://v2.bsestarmf.in/api') {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  public getMode(): 'LIVE' {
    return 'LIVE';
  }

  public async sendEncryptedRequest(
    endpoint: string,
    encryptedJws: string,
    headers: Record<string, string | undefined>
  ): Promise<string> {
    const targetUrl = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;

    // Clean headers for fetch
    const cleanHeaders: Record<string, string> = {};
    for (const [key, value] of Object.entries(headers)) {
      if (value !== undefined) {
        cleanHeaders[key] = value;
      }
    }

    try {
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: cleanHeaders,
        body: encryptedJws
      });

      if (!response.ok && response.status !== 400 && response.status !== 401 && response.status !== 422) {
        throw new Error(`BSE Gateway HTTP error: ${response.status} ${response.statusText}`);
      }

      // Live BSE returns compact JWS token as text
      const responseText = await response.text();
      return responseText;
    } catch (error: any) {
      throw new Error(`Network failure connecting to BSE Gateway (${targetUrl}): ${error.message}`);
    }
  }
}
