#!/bin/bash
# ==============================================================================
# Tanashvi Fintech Private Limited (ARN-347849 / Member 94515)
# BSE StAR MF v2.0 - Oracle Cloud Live UAT Runner
# 
# Static IP: 130.210.57.235 (Ubuntu 22.04 LTS)
# ==============================================================================

set -e

echo "========================================================================"
echo "🚀 Tanashvi Fintech - BSE StAR MF v2.0 Live UAT Verification"
echo "========================================================================"
echo "Server Static IP: 130.210.57.235"
echo "Target Member ID: 94515"
echo "Target User ID:   tanashvifintechpvtltd"
echo "Target Gateway:   https://starmfv2demo.bseindia.com"
echo "Date:             $(date)"
echo "------------------------------------------------------------------------"

# 1. Verify Node.js
echo "🔍 Checking Node.js runtime..."
node -v || { echo "❌ Node.js is not installed!"; exit 1; }
npm -v

# 2. Check RSA Private Key permissions
KEY_PATH="$HOME/bse-backend/bse_api_private.pem"
if [ -f "$KEY_PATH" ]; then
    echo "🔑 Verified Private Key at $KEY_PATH"
    chmod 400 "$KEY_PATH"
    echo "🔒 Enforced chmod 400 permissions on private key"
else
    echo "⚠️ Private key not found at $KEY_PATH, checking local directory..."
fi

# 3. Quick curl probe to BSE Demo Gateway
echo "🌐 Probing BSE StAR MF Demo Gateway TLS Handshake..."
curl -s -o /dev/null -w "HTTP Response Code: %{http_code} | Connect Time: %{time_connect}s | Total: %{time_total}s\n" https://starmfv2demo.bseindia.com || echo "⚠️ Direct curl connection timed out or was filtered"

# 4. Run Node.js Diagnostic & Auth Test
echo "🧪 Running Live Authentication & Token Retrieval Test..."
node verify_bse_uat.js

echo "========================================================================"
echo "✅ UAT Diagnostic Execution Completed."
echo "========================================================================"
