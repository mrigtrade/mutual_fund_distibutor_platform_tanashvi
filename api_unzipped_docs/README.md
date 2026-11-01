# BSE StAR MF - Scheme Master Synchronization Utility

## Overview
This utility is the official Python reference implementation for fetching the complete Scheme Master from BSE StAR MF v2 APIs. It implements the mandatory **JOSE (JSON Object Signing and Encryption)** security standard required for all API communication.

**Key Features:**
- **Production-Ready Security:** Implements JWE (Encryption) + JWS (Signing) standards.
- **High Performance:** Uses multi-threaded concurrent fetching for rapid data synchronization.
- **Audit Compliance:** Generates detailed Excel summary reports.
- **Resiliency:** Robust error handling designed for production environments.

## Prerequisites

### System Requirements
- **OS:** Windows, Linux, or macOS
- **Python:** Version 3.8 or higher
- **Network:** Allow outbound HTTPS (port 443) access to:
  - `https://v2.bsestarmf.in`

### Required Libraries
Install the necessary Python dependencies using `pip`:

```bash
pip install requests jwcrypto openpyxl
```

## Configuration

**Important:** You must configure this script with your unique Member credentials before execution.

Open the script `scheme_master_fetch(Member Login).py` in a text editor and locate the `MEMBER CONFIG` section at the top. Update the following variables:

| Variable | Description |
| :--- | :--- |
| `USERNAME` | Your Exchange-provided API Username (e.g., `member/0000/abcd.admin`) |
| `PASSWORD` | Your API Password |
| `ORG_CODE` | Your Member Code |
| `FINGERPRINT` | Your Fingerprint (Checksum) Key |
| `MEMBER_PRIVATE_PEM` | **Paste your Private Key here.** Ensure you include the `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----` markers. |
| `BSE_PUBLIC_PEM` | **Paste BSE's Public Key here.** This key is provided by the BSE Exchange team. |

> **Security Warning:** This script contains sensitive credentials once configured. Ensure strict file permissions are applied. Do not commit the configured script to public repositories.

## Execution

Run the script from your command prompt or terminal:

```bash
python "scheme_master_fetch(Member Login).py"
```

*Note: Ensure you are in the directory containing the script.*

## Output Files

The script generates two files in the current directory, stamped with the execution date/time:

### 1. Scheme Master Data (JSON)
- **Filename:** `SCHEME_MASTER_<ORG_CODE>_<DATE>.json`
- **Format:** Standard JSON array containing all active scheme objects.
- **Usage:** Use this file to import scheme configurations into your back-office, risk management, or trading systems.

### 2. Audit Report (Excel)
- **Filename:** `SCHEME_MASTER_AUDIT_<ORG_CODE>_<TIMESTAMP>.xlsx`
- **Tabs:**
  - **Summary:** High-level fetch statistics, total records, and execution timing.
  - **AMC Metrics:** Statistical breakdown of schemes by Asset Management Company.
  - **Duplicate Report:** Identifies and logs any redundant data emitted by the API (useful for data quality checks).

## Troubleshooting

| Error | Common Cause | Solution |
| :--- | :--- | :--- |
| `ValueError: Private key not found` | Invalid Private Key format | Ensure `MEMBER_PRIVATE_PEM` is pasted correctly with headers. |
| `ConnectionError` / `Timeout` | Network Firewall | Whitelist `v2.bsestarmf.in` on port 443. |
| `HTTP 401 Unauthorized` | Invalid Credentials | Verify `USERNAME`, `PASSWORD`, and `FINGERPRINT`. |
| `ImportError: No module named...` | Missing Libraries | Run `pip install requests jwcrypto openpyxl`. |

---
**Disclaimer:** This reference implementation is provided "as is" by BSE StAR MF to assist members with API integration. Members are responsible for ensuring their final implementation meets all internal security and compliance standards.
