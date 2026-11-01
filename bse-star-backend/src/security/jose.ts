/**
 * BSE StAR MF v2.0 - Production JOSE (Javascript Object Signing and Encryption) Security Module
 * 
 * Complies strictly with BSE StAR MF v2 Security Specifications:
 * - JWE: RSA-OAEP-256 (Key Wrap) + A256GCM (Content Encryption)
 * - JWS: RS256 (Signature)
 * - Payload Format: Compact JWS wrapping a Compact JWE (Content-Type: application/jose)
 * 
 * Developed for Tanashvi Fintech Private Limited (ARN-347849)
 * Multi-Tenant B2B Mutual Fund Platform
 */

import {
  importSPKI,
  importPKCS8,
  CompactEncrypt,
  compactDecrypt,
  CompactSign,
  compactVerify
} from 'jose';
import * as crypto from 'crypto';

export interface JoseKeyConfig {
  bsePublicKeyPem: string;
  memberPrivateKeyPem: string;
  memberPrivateKeyPassphrase?: string;
}

export class JoseSecurityService {
  /**
   * Normalizes PEM strings, handling escaped newlines or raw multi-line strings.
   */
  private static normalizePem(pem: string): string {
    let clean = pem.trim();
    if (clean.includes('\\n')) {
      clean = clean.replace(/\\n/g, '\n');
    }
    return clean;
  }

  /**
   * Imports BSE Public Key (SPKI) for a specified algorithm.
   */
  public static async loadPublicKey(pem: string, alg: 'RSA-OAEP-256' | 'RS256'): Promise<CryptoKey | Uint8Array> {
    const normalized = this.normalizePem(pem);
    return await importSPKI(normalized, alg);
  }

  /**
   * Imports Member Private Key (PKCS#8) for a specified algorithm.
   * If passphrase is provided or PKCS#1 format is provided, it is converted to unencrypted PKCS#8.
   */
  public static async loadPrivateKey(
    pem: string,
    alg: 'RSA-OAEP-256' | 'RS256',
    passphrase?: string
  ): Promise<CryptoKey | Uint8Array> {
    let normalized = this.normalizePem(pem);

    // If key is encrypted or in PKCS#1 (RSA PRIVATE KEY), normalize to PKCS#8 via crypto.KeyObject
    try {
      const keyObj = crypto.createPrivateKey({
        key: normalized,
        format: 'pem',
        passphrase: passphrase
      });
      normalized = keyObj.export({ type: 'pkcs8', format: 'pem' }) as string;
    } catch {
      // If already standard PKCS#8 string without password, proceed
    }

    return await importPKCS8(normalized, alg);
  }

  /**
   * ctEncrypt - Encrypt and sign outgoing request payload to BSE StAR MF v2.
   * 
   * Flow:
   * 1. Payload JSON string is encrypted with BSE Public Key using RSA-OAEP-256 + A256GCM -> Compact JWE
   * 2. Compact JWE string is signed with Member Private Key using RS256 -> Compact JWS
   * 3. Resulting compact JWS string is returned to be sent as raw body with Content-Type: application/jose
   * 
   * @param payload Plain JavaScript Object or DTO to be encrypted
   * @param bsePublicKeyPem BSE StAR MF Public Key (PEM format)
   * @param memberPrivateKeyPem Member RSA Private Key (PEM format)
   * @param memberPassphrase Optional passphrase for encrypted private key
   * @returns JWS Compact string (application/jose payload)
   */
  public static async ctEncrypt(
    payload: Record<string, any>,
    bsePublicKeyPem: string,
    memberPrivateKeyPem: string,
    memberPassphrase?: string
  ): Promise<string> {
    if (!payload || typeof payload !== 'object') {
      throw new Error('JOSE Encrypt Error: Payload must be a non-null object');
    }
    if (!bsePublicKeyPem) {
      throw new Error('JOSE Encrypt Error: BSE Public Key PEM is required');
    }
    if (!memberPrivateKeyPem) {
      throw new Error('JOSE Encrypt Error: Member Private Key PEM is required');
    }

    // Step 1: Serialize JSON without extra whitespaces
    const jsonStr = JSON.stringify(payload);
    const plaintext = new TextEncoder().encode(jsonStr);

    // Load BSE Public Key for RSA-OAEP-256
    const bsePubKey = await this.loadPublicKey(bsePublicKeyPem, 'RSA-OAEP-256');

    // JWE Encrypt
    const jwe = await new CompactEncrypt(plaintext)
      .setProtectedHeader({ alg: 'RSA-OAEP-256', enc: 'A256GCM' })
      .encrypt(bsePubKey);

    // Step 2: Sign JWE Compact with Member Private Key using RS256
    const memberPrivKey = await this.loadPrivateKey(memberPrivateKeyPem, 'RS256', memberPassphrase);
    const jweBytes = new TextEncoder().encode(jwe);

    const jwsCompact = await new CompactSign(jweBytes)
      .setProtectedHeader({ alg: 'RS256' })
      .sign(memberPrivKey);

    return jwsCompact;
  }

  /**
   * ctDecrypt - Verify signature and decrypt incoming response payload from BSE StAR MF v2.
   * 
   * Flow:
   * 1. JWS Compact string is verified using BSE Public Key (RS256).
   * 2. Verified payload contains the JWE Compact string.
   * 3. JWE Compact string is decrypted using Member Private Key (RSA-OAEP-256 + A256GCM).
   * 4. Plaintext UTF-8 string is parsed as JSON and returned.
   * 
   * @param encryptedResponseCompact Compact JWS string received in BSE HTTP response
   * @param bsePublicKeyPem BSE StAR MF Public Key (used to verify BSE's signature)
   * @param memberPrivateKeyPem Member RSA Private Key (used to decrypt JWE)
   * @param memberPassphrase Optional passphrase for encrypted private key
   * @returns Decrypted JavaScript object (or raw string if not JSON)
   */
  public static async ctDecrypt<T = any>(
    encryptedResponseCompact: string,
    bsePublicKeyPem: string,
    memberPrivateKeyPem: string,
    memberPassphrase?: string
  ): Promise<T> {
    if (!encryptedResponseCompact || typeof encryptedResponseCompact !== 'string') {
      throw new Error('JOSE Decrypt Error: Compact token must be a non-empty string');
    }
    if (!bsePublicKeyPem) {
      throw new Error('JOSE Decrypt Error: BSE Public Key PEM is required');
    }
    if (!memberPrivateKeyPem) {
      throw new Error('JOSE Decrypt Error: Member Private Key PEM is required');
    }

    const cleanToken = encryptedResponseCompact.trim();

    // Step 1: Verify JWS Signature with BSE Public Key
    const bsePubKey = await this.loadPublicKey(bsePublicKeyPem, 'RS256');
    let jweCompactBytes: Uint8Array;

    try {
      const { payload } = await compactVerify(cleanToken, bsePubKey);
      jweCompactBytes = payload;
    } catch (err: any) {
      throw new Error(`JOSE Decrypt Error: JWS verification failed with BSE Public Key: ${err.message}`);
    }

    const jweCompact = new TextDecoder().decode(jweCompactBytes);

    // Step 2: Decrypt JWE with Member Private Key
    const memberPrivKey = await this.loadPrivateKey(memberPrivateKeyPem, 'RSA-OAEP-256', memberPassphrase);
    let plaintextBytes: Uint8Array;

    try {
      const { plaintext } = await compactDecrypt(jweCompact, memberPrivKey);
      plaintextBytes = plaintext;
    } catch (err: any) {
      throw new Error(`JOSE Decrypt Error: JWE decryption failed with Member Private Key: ${err.message}`);
    }

    const jsonStr = new TextDecoder().decode(plaintextBytes);

    try {
      return JSON.parse(jsonStr) as T;
    } catch {
      return jsonStr as unknown as T;
    }
  }

  /**
   * Helper utility to generate an RSA 2048-bit keypair for testing or member initialization.
   */
  public static generateKeyPair(): { publicKeyPem: string; privateKeyPem: string } {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      }
    });

    return {
      publicKeyPem: publicKey,
      privateKeyPem: privateKey
    };
  }
}
