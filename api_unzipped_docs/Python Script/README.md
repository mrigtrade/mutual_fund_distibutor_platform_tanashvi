# StARMF 2.0 — Production-ready Python CLI for JOSE (JWE + JWS)

Minimal and audited command-line client for **BSE StARMF v2**.
Implements the exact client-side JOSE flow used to **encrypt (JWE)** payloads for BSE and **sign (JWS)** them — and to **verify** and **decrypt** responses returned by BSE.

This repository intentionally ships **no private keys**. You are responsible for generating, storing and rotating your own keys.

---

## What this does

- `ct_encrypt(payload, bse_public_pem, my_private_pem, my_priv_password=None)`
  Produces a **compact JWS** string whose payload is a **compact JWE** (RSA-OAEP-256 + A256GCM). Send this string as the request body to BSE.

- `ct_decrypt(encrypted_response_compact, bse_public_pem, my_private_pem, my_priv_password=None)`
  Verifies the JWS signature (BSE public key), extracts the JWE compact payload and **decrypts** it with your private key. Returns parsed JSON (or raw bytes/string if not JSON).

- `make_headers(org_code, fingerprint, access_token, trace_id=None)`
  Helper for building required headers. **Note:** fingerprint is supplied by BSE.

---

## Repository layout

```
.
├── starmf_encrypt_decrypt.py - main CLI + importable library
├── requirements.txt - lightweight dependencies (`jwcrypto`, `cryptography`)
├── payload.json - Payload to encrypt
├── README.md - This file
├── bse_public.pem` — BSE public key (provided by BSE)
└── my_private.pem` — Your private key
---

## Requirements & installation

Python 3.8+ recommended.
jwcrypto==1.4.2
cryptography==41.0.3

Install:

pip install -r requirements.txt  OR pip install jwcrypto cryptography

## Usage

### 1. Prepare files:

- `bse_public.pem` - save bse public key
- `my_private.pem` - save your private key
- `payload.json` - Add your request JSON payload to `payload.json` (example given in the file).

### 2. Encrypt + sign Encrypt + sign (produce request_body.txt file):

python starmf_encrypt_decrypt.py encrypt --payload-file payload.json --bse-public-pem bse_public.pem --my-private-pem my_private.pem > request_body.txt

### 3. Send to BSE:

- Method: POST
  -Headers:
  Content-Type: application/jose
  X-API-Org-ID: member/<ORG_CODE>:<FINGERPRINT> (for eg. in value: member/0000:ABCDEFGHASOIQW)
  Authorization: Bearer <token> # Mandatory for all except Login API

In case of Postman:
Set Body to: raw and Text and paste contents of request_body.txt

```

### 4. Decrypt response

Save response body to `response_body.txt` and then verify & decrypt:

python starmf_encrypt_decrypt.py decrypt --response-file "response_body.txt" --bse-public-pem bse_public.pem --my-private-pem my_private.pem > decrypted_output.json

5. Open `decrypted_output.json` to view the fully decrypted response.

## Security best practices

- **Key management:** prefer hardware-backed keys (HSM or cloud KMS) for private keys; if using files, protect with strong OS permissions and consider encrypting the file with a passphrase.
- **Rotation:** implement key rotation and a process to publish new public keys to BSE when changing keys.
- **Least privilege:** the machine performing crypto should have minimum network access and run only the process required.
- **Dependency pinning:** pin `jwcrypto` and `cryptography` to known-good versions in production.
- **Secrets storage:** do not store private keys in source control or in logs.

## Example flow (end-to-end)

1. `encrypt` produces a compact JWS/JWE string -> `request_body.txt`.
2. API call to BSE with proper headers.
3. BSE returns a JWS+JWE response (compact string) -> save to `response_body.txt`.
4. `decrypt` verifies signature and decrypts -> `decrypted_output.json`.

```

```

```

```
