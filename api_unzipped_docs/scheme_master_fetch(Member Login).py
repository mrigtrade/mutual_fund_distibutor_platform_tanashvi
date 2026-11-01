#!/usr/bin/env python3
import json
import sys
import uuid
import time
from datetime import datetime
import concurrent.futures

import requests
from jwcrypto import jwk, jwe, jws
from jwcrypto.common import json_encode

from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill
from openpyxl.chart import BarChart, Reference

# =========================
# MEMBER CONFIG (ONLY EDIT THIS)
# =========================

BASE_URL = "https://v2.bsestarmf.in/api"

USERNAME = "member/0000/abcd.admin"
PASSWORD = "password"

ORG_CODE = "<input member code>"
FINGERPRINT = "<input checksum>"

# ---- COPY–PASTE KEYS HERE ----

MEMBER_PRIVATE_PEM = """-----BEGIN PRIVATE KEY-----
-----END PRIVATE KEY-----"""

BSE_PUBLIC_PEM = """-----BEGIN PUBLIC KEY-----
-----END PUBLIC KEY-----"""

PAGE_SIZE = 1000
MAX_WORKERS = 50

# =========================
# STANDARDIZED OUTPUT NAMES
# =========================

RUN_DATE = datetime.now().strftime("%Y%m%d")

OUTPUT_JSON = f"SCHEME_MASTER_{ORG_CODE}_{RUN_DATE}.json"
OUTPUT_EXCEL = f"SCHEME_MASTER_SUMMARY_{ORG_CODE}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"

# =========================
# LOGGING
# =========================

def log(msg, level="INFO"):
    print(f"[{datetime.now():%Y-%m-%d %H:%M:%S}] [{level}] {msg}", flush=True)

def fatal(msg):
    log(msg, "ERROR")
    sys.exit(1)

# =========================
# CRYPTO INIT
# =========================

def load_jwk(pem: str):
    return jwk.JWK.from_pem(pem.encode())

MEMBER_PRIV_JWK = load_jwk(MEMBER_PRIVATE_PEM)
BSE_PUB_JWK = load_jwk(BSE_PUBLIC_PEM)

def encrypt_payload(payload: dict) -> str:
    plaintext = json.dumps(payload, separators=(",", ":"), ensure_ascii=False).encode()

    jwe_token = jwe.JWE(
        plaintext,
        protected=json_encode({"alg": "RSA-OAEP-256", "enc": "A256GCM"})
    )
    jwe_token.add_recipient(BSE_PUB_JWK)
    jwe_compact = jwe_token.serialize(compact=True)

    jws_token = jws.JWS(jwe_compact.encode())
    jws_token.add_signature(MEMBER_PRIV_JWK, None, json_encode({"alg": "RS256"}))

    return jws_token.serialize(compact=True)

def decrypt_response(jws_compact: str):
    jws_token = jws.JWS()
    jws_token.deserialize(jws_compact)
    jws_token.verify(BSE_PUB_JWK)

    jwe_compact = jws_token.payload.decode()
    jwe_token = jwe.JWE()
    jwe_token.deserialize(jwe_compact)
    jwe_token.decrypt(MEMBER_PRIV_JWK)

    return json.loads(jwe_token.payload.decode())

# =========================
# LOGIN
# =========================

def login(session: requests.Session) -> str:
    payload = {
        "data": {
            "username": USERNAME,
            "password": PASSWORD
        }
    }

    headers = {
        "Content-Type": "application/jose",
        "X-API-Org-ID": f"member/{ORG_CODE}:{FINGERPRINT}"
    }

    encrypted = encrypt_payload(payload)

    resp = session.post(
        f"{BASE_URL}/login",
        data=encrypted,
        headers=headers,
        timeout=30
    )

    if resp.status_code != 200:
        fatal(f"Login HTTP failure: {resp.status_code} {resp.text}")

    data = decrypt_response(resp.text)
    log("Login successful")
    return data["data"]["access_token"]

# =========================
# FETCH PAGE
# =========================

def fetch_page(session, token, start):
    payload = {
        "data": {
            "fields": ["ALL"],
            "count_only": False,
            "start": start,
            "length": PAGE_SIZE,
            "filter_param": {},
            "search": {"value": ""}
        }
    }

    headers = {
        "Content-Type": "application/jose",
        "Authorization": f"Bearer {token}",
        "X-API-Org-ID": f"member/{ORG_CODE}:{FINGERPRINT}",
        "X-STARMFv2-Trace-ID": str(uuid.uuid4())
    }

    encrypted = encrypt_payload(payload)

    resp = session.post(
        f"{BASE_URL}/master_scheme_list",
        data=encrypted,
        headers=headers,
        timeout=60
    )
    
    if resp.status_code != 200:
        try:
            err = decrypt_response(resp.text)
            fatal(f"API Error {resp.status_code}: {json.dumps(err, indent=2)}")
        except Exception:
            fatal(f"HTTP {resp.status_code} (response not decryptable)")

    return decrypt_response(resp.text)["data"]

# =========================
# MAIN
# =========================

def main():
    start_time = datetime.now()
    log(f"Starting Scheme Master Fetch (Threaded) at {start_time}")

    with requests.Session() as session:
        t0 = datetime.now()
        token = login(session)
        login_time = (datetime.now() - t0).total_seconds()
        log(f"Login took {login_time:.2f}s")

        t0 = datetime.now()
        first = fetch_page(session, token, 0)
        first_page_time = (datetime.now() - t0).total_seconds()
        
        total = first["count"]
        # log(f"Total schemes: {total} (First page fetch: {first_page_time:.2f}s)")

        seen = {}
        records = []
        duplicates = []
        amc_dup = {}

        def process(batch):
            nonlocal seen, records, duplicates, amc_dup
            for r in batch:
                key = r.get("scheme_bse_code")
                if key in seen:
                    amc = r.get("scheme_amc_name", "UNKNOWN")
                    amc_dup[amc] = amc_dup.get(amc, 0) + 1
                    r["_audit_duplicate_reason"] = "API_REEMISSION"
                    duplicates.append(r)
                else:
                    seen[key] = True
                    records.append(r)

        process(first["lists"])

        # --- MULTIPLE THREADED FETCHING () ---
        tasks = range(PAGE_SIZE, total, PAGE_SIZE)
        
        fetch_start_time = datetime.now()
        log(f"Multiple Threaded: Fetching {len(tasks)} pages with {MAX_WORKERS} threads...")
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
            # Create a future for each page
            # We map a partial function or lambda to pass session and token
            future_to_start = {executor.submit(fetch_page, session, token, start): start for start in tasks}
            
            completed_count = 0
            total_tasks = len(tasks)
            
            for future in concurrent.futures.as_completed(future_to_start):
                start = future_to_start[future]
                try:
                    data = future.result()
                    process(data["lists"])
                except Exception as exc:
                    log(f"Page starting at {start} generated an exception: {exc}", "ERROR")
                
                completed_count += 1
                
                # Lightweight progress logging
                if completed_count % (max(1, total_tasks // 10)) == 0:
                    cur = len(records) + len(duplicates)
                    elapsed = (datetime.now() - fetch_start_time).total_seconds()
                    speed = (cur - PAGE_SIZE) / elapsed if elapsed > 0 else 0
                    log(f"Progress: {completed_count}/{total_tasks} pages | {cur} recs | {int(speed)} rec/s")
        
        total_time = (datetime.now() - start_time).total_seconds()
        log(f"Download Finished! Total time to download: {total_time:.2f}s. Generating Reports...")

        # JSON output
        with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
            json.dump({"count": len(records), "lists": records}, f, indent=2, ensure_ascii=False)

        # =========================
        # 1. SUMMARY REPORT
        # =========================
        wb_audit = Workbook()
        
        HEADER = PatternFill("solid", fgColor="BDD7EE")
        BAD = PatternFill("solid", fgColor="FFC7CE")
        BOLD = Font(bold=True)

        def excel_safe(val):
            return str(val) if val is not None else ""

        #Summary
        ws = wb_audit.active
        ws.title = "Summary"
        ws.append(["Metric", "Value"])
        for c in ws[1]:
            c.font = BOLD
            c.fill = HEADER

        fetched_count = len(records) + len(duplicates)
        
        # Calculate AMC Stats
        amc_stats = {}
        for r in records:
            amc = r.get("scheme_amc_name", "Unknown")
            amc_stats[amc] = amc_stats.get(amc, 0) + 1
            
        total_amcs = len(amc_stats)

        # Basic Metrics
        metrics = [
            ("Total fetched", fetched_count),
            ("Unique schemes", len(records)),
            ("Duplicates (API re-emission)", len(duplicates)),
            ("Dedup key", "scheme_bse_code"),
            ("Total AMCs Participating", total_amcs),
            ("Total Time (s)", f"{total_time:.2f}"),
            ("Avg Speed (rec/s)", f"{fetched_count/total_time:.0f}")
        ]
        
        for k, v in metrics:
            ws.append([k, v])
            
        # Add Spacing
        ws.append([])
        ws.append([])
        
        # AMC Wise Details Section
        ws.append(["AMC Name", "Total Schemes"])
        header_row = ws.max_row
        for col in range(1, 3):
             cell = ws.cell(row=header_row, column=col)
             cell.font = BOLD
             cell.fill = HEADER
             
        # Sort AMCs by count desc
        for amc, count in sorted(amc_stats.items(), key=lambda x: x[1], reverse=True):
            ws.append([amc, count])

        # Auto-width
        ws.column_dimensions['A'].width = 40
        ws.column_dimensions['B'].width = 20

        # AMC Duplicate Summary
        ws2 = wb_audit.create_sheet("AMC Duplicate Summary")
        ws2.append(["AMC", "Duplicate Count"])
        for c in ws2[1]:
            c.font = BOLD
            c.fill = HEADER

        for amc, cnt in sorted(amc_dup.items(), key=lambda x: x[1], reverse=True):
            ws2.append([amc, cnt])

        chart = BarChart()
        chart.title = "AMC vs Duplicate Schemes"
        chart.add_data(Reference(ws2, min_col=2, min_row=1, max_row=ws2.max_row), titles_from_data=True)
        chart.set_categories(Reference(ws2, min_col=1, min_row=2, max_row=ws2.max_row))
        ws2.add_chart(chart, "E2")

        # Unique Schemes
        ws3 = wb_audit.create_sheet("Unique Schemes")
        if records:
            keys = sorted({k for r in records for k in r.keys()})
            ws3.append(keys)
            for c in ws3[1]:
                c.font = BOLD
                c.fill = HEADER

            for r in records:
                ws3.append([excel_safe(r.get(k)) for k in keys])

        # Duplicate Schemes
        ws4 = wb_audit.create_sheet("Duplicate Schemes")
        if duplicates:
            dkeys = sorted({k for r in duplicates for k in r.keys()})
            if "_audit_duplicate_reason" in dkeys:
                dkeys.remove("_audit_duplicate_reason")
                dkeys.insert(0, "_audit_duplicate_reason")

            ws4.append(dkeys)
            for c in ws4[1]:
                c.font = BOLD
                c.fill = BAD

            for r in duplicates:
                ws4.append([excel_safe(r.get(k)) for k in dkeys])

        wb_audit.save(OUTPUT_EXCEL)
        log(f"Summary Report Saved: {OUTPUT_EXCEL}")
        log("DONE")

if __name__ == "__main__":
    main()
