#!/usr/bin/env python3
"""
starmf_encrypt_decrypt.py

Production-ready helper for BSE StARMF v2 JOSE flow.

Features:
 - ct_encrypt(payload_dict, bse_public_pem, my_private_pem, my_priv_password=None)
    -> returns JWS-compact string (request body to send)
 - ct_decrypt(encrypted_response_compact, bse_public_pem, my_private_pem, my_priv_password=None)
    -> verifies JWS (signed by BSE) and decrypts JWE -> returns Python object or raw string
 - make_headers(org_code, fingerprint, access_token, trace_id=None) -> headers dict

CLI:
 - encrypt  : encrypt+sign JSON payload file -> prints JWS compact (stdout)
 - decrypt  : verify+decrypt response string file -> prints JSON or raw

Install:
    pip install jwcrypto

Security:
 - Do NOT distribute private keys.
 - Keep private key private; do not share anywhere.
"""

from __future__ import annotations
import os
import sys
import json
import uuid
import argparse
from jwcrypto import jwk, jwe, jws
from jwcrypto.common import json_encode


def load_jwk_from_pem(pem_path_or_str, is_private=False, password: str = None):
    """
    Load JWK from path or PEM content string.
    Works on Windows without strict file-permission checks.
    """
    pem_bytes = None
    if isinstance(pem_path_or_str, (bytes, bytearray)):
        pem_bytes = bytes(pem_path_or_str)
    elif os.path.exists(pem_path_or_str):
        with open(pem_path_or_str, "rb") as f:
            pem_bytes = f.read()
    else:
        # treat as PEM content string
        pem_bytes = pem_path_or_str.encode() if isinstance(pem_path_or_str, str) else pem_path_or_str

    try:
        if password:
            return jwk.JWK.from_pem(pem_bytes, password=password.encode())
        else:
            return jwk.JWK.from_pem(pem_bytes)
    except Exception as ex:
        raise ValueError(f"Failed to load PEM key. is_private={is_private}. Error: {ex}")


# -------------------------
# Core: encrypt (outgoing)
# -------------------------
def ct_encrypt(payload: dict, bse_public_pem: str, my_private_pem: str, my_priv_password: str = None) -> str:
    """
    Create JWE (RSA-OAEP-256 / A256GCM) of JSON payload encrypted to BSE public key,
    then sign that JWE (RS256) using member private key. Returns JWS compact string.
    """
    bse_pub_jwk = load_jwk_from_pem(bse_public_pem, is_private=False)
    my_priv_jwk = load_jwk_from_pem(my_private_pem, is_private=True, password=my_priv_password)

    plaintext = json.dumps(payload, separators=(",", ":"), ensure_ascii=False).encode("utf-8")

    jwetoken = jwe.JWE(plaintext,
                       protected=json_encode({"alg": "RSA-OAEP-256", "enc": "A256GCM"}))
    jwetoken.add_recipient(bse_pub_jwk)
    jwe_compact = jwetoken.serialize(compact=True)

    jws_token = jws.JWS(jwe_compact.encode("utf-8"))
    jws_token.add_signature(my_priv_jwk, None, json_encode({"alg": "RS256"}))
    jws_compact = jws_token.serialize(compact=True)

    return jws_compact


# -------------------------
# Core: decrypt (incoming)
# -------------------------
def ct_decrypt(encrypted_response_compact: str, bse_public_pem: str, my_private_pem: str, my_priv_password: str = None):
    """
    Verify JWS (signed by BSE public key), extract JWE compact payload and decrypt with member private key.
    Returns parsed JSON or raw string.
    """
    bse_pub_jwk = load_jwk_from_pem(bse_public_pem, is_private=False)
    my_priv_jwk = load_jwk_from_pem(my_private_pem, is_private=True, password=my_priv_password)

    jws_token = jws.JWS()
    try:
        jws_token.deserialize(encrypted_response_compact)
    except Exception as e:
        raise ValueError(f"Invalid JWS compact serialization: {e}")

    try:
        jws_token.verify(bse_pub_jwk)
    except Exception as e:
        raise ValueError(f"JWS signature verification failed: {e}")

    jwe_compact_bytes = jws_token.payload
    jwe_compact = jwe_compact_bytes.decode("utf-8") if isinstance(jwe_compact_bytes, (bytes, bytearray)) else str(jwe_compact_bytes)

    jwe_token = jwe.JWE()
    try:
        jwe_token.deserialize(jwe_compact)
        jwe_token.decrypt(my_priv_jwk)
    except Exception as e:
        raise ValueError(f"JWE decryption failed: {e}")

    plaintext_bytes = jwe_token.payload
    try:
        plaintext = plaintext_bytes.decode("utf-8")
    except Exception:
        return plaintext_bytes

    try:
        return json.loads(plaintext)
    except Exception:
        return plaintext


# -------------------------
# Headers helper
# -------------------------
def make_headers(org_code: str, fingerprint: str, access_token: str, trace_id: str = None) -> dict:
    if trace_id is None:
        trace_id = str(uuid.uuid4())
    return {
        "Content-Type": "application/jose",
        "X-API-Org-ID": f"member/{org_code}:{fingerprint}",
        "Authorization": f"Bearer {access_token}",
        "X-STARMFv2-Trace-ID": trace_id
    }


# -------------------------
# CLI
# -------------------------
def cli():
    parser = argparse.ArgumentParser(description="StARMF v2 Encrypt/Decrypt helper (JWE->JWS)")
    sub = parser.add_subparsers(dest="cmd", required=True)

    # only provide encrypt & decrypt in CLI
    sub_enc = sub.add_parser("encrypt", help="Encrypt+sign a JSON payload file")
    sub_enc.add_argument("--payload-file", required=True, help="Path to JSON file with payload")
    sub_enc.add_argument("--bse-public-pem", required=True, help="Path or PEM content for BSE public key")
    sub_enc.add_argument("--my-private-pem", required=True, help="Path or PEM content for my private key (PEM)")
    sub_enc.add_argument("--my-priv-password", required=False, help="Password for my private PEM (if encrypted)")

    sub_dec = sub.add_parser("decrypt", help="Verify+decrypt a JWS-compact response saved in a file")
    sub_dec.add_argument("--response-file", required=True, help="Path to file containing response JWS compact string")
    sub_dec.add_argument("--bse-public-pem", required=True, help="Path or PEM content for BSE public key (to verify)")
    sub_dec.add_argument("--my-private-pem", required=True, help="Path or PEM content for my private key (to decrypt)")
    sub_dec.add_argument("--my-priv-password", required=False, help="Password for my private PEM (if encrypted)")

    args = parser.parse_args()

    if args.cmd == "encrypt":
        with open(args.payload_file, "r", encoding="utf-8") as f:
            payload = json.load(f)
        jws_compact = ct_encrypt(payload, args.bse_public_pem, args.my_private_pem, args.my_priv_password)
        # Print single-line compact JWS (no extra newlines)
        sys.stdout.write(jws_compact)
        return

    if args.cmd == "decrypt":
        with open(args.response_file, "r", encoding="utf-8") as f:
            response_compact = f.read().strip()
        data = ct_decrypt(response_compact, args.bse_public_pem, args.my_private_pem, args.my_priv_password)
        if isinstance(data, (dict, list)):
            print(json.dumps(data, indent=2, ensure_ascii=False))
        else:
            print(data)
        return


if __name__ == "__main__":
    try:
        cli()
    except PermissionError as pe:
        print("PERMISSION ERROR:", pe, file=sys.stderr)
        sys.exit(3)
    except Exception as e:
        print("ERROR:", e, file=sys.stderr)
        sys.exit(4)
