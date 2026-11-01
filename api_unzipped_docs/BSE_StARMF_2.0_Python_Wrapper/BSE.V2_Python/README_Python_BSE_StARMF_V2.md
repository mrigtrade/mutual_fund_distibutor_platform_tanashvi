#  BSE StAR MF v2.0 Python Wrapper + API Gateway

This production-grade hybrid toolkit lets you integrate with BSE StAR MF v2.0 APIs via:
- A secure Python SDK (for backend automation)
- A Flask REST API Gateway (for Postman, UIs, QA teams)

> Designed for sandbox & production environments with AES-128 encryption, PKCS7 padding, token auth, and modular payload services.

---

##  Table of Contents
- [Project Purpose](#project-purpose)
- [Project Structure](#project-structure)
- [Setup Instructions](#setup-instructions)
- [Configuration](#configuration)
- [Usage Modes](#usage-modes)
- [Supported Modules](#supported-modules)
- [Encryption & Certificates](#encryption--certificates)
- [Example: Add UCC Programmatically](#example-add-ucc-programmatically)
- [Use Case: Real-World Scenario](#use-case-real-world-scenario)
- [Postman / API Testing Guide](#postman--api-testing-guide)
- [Common Errors & Fixes](#common-errors--fixes)
- [FAQs](#faqs)
- [Version](#version)

---

##  Project Purpose
To simplify and secure the integration process with BSE StAR MF 2.0 APIs by offering prebuilt encryption,
modular JSON model builders, and Postman/React/CLI compatibility for faster UAT and onboarding.

---

##  Project Structure
```
BSE.V2_Python/
├── app/
│   ├── main.py                  # Flask server: exposes API endpoints
│   ├── config/settings.py       # Your credentials, URLs, keys
│   ├── models/                  # JSON payload generators
│   ├── utils/                   # AES encryption helpers
├── run_demo.py                  # CLI tester for Add UCC
├── sample_payload_add_ucc.json  # Test file for UCC creation
├── requirements.txt
```

---

##  Setup Instructions
```bash
# Install Python ≥ 3.10
pip install -r requirements.txt

# Run CLI demo (Add UCC)
python run_demo.py

# Run Flask API Gateway
python app/main.py  # or use gunicorn for prod
```

---

##  Configuration
Edit the file `app/config/settings.py`:
```python
MEMBER_CODE = "YOURMEMBERCODE"
USER_ID = "youruserid"
PASSWORD = "yourpassword"
AES_KEY = "8080...12345678"
AES_IV = "8080...12345678"
BSE_BASE_URL = "https://starmfv2demo.bseindia.com"
CERT_PATH = "certs/client.pfx"  # Optional
CERT_PASSWORD = "yourpass"
```
- Use sandbox keys for UAT testing.
- Production keys and URLs must be secured and rotated periodically.

---
## 🧪 Usage Modes

**Option 1: Use as Python SDK (Backend Integration)**  
Use the wrapper directly in your Python backend or automation scripts:

```python
from app.models.ucc.addnewucc_request import AddNewUCCRequest
from app.utils.encrypt import encrypt_payload
from app.config.settings import AES_KEY, AES_IV, BSE_BASE_URL
import requests

# 1. Construct the UCC object
ucc = AddNewUCCRequest(...)

# 2. Convert to payload and encrypt
payload = ucc.to_dict()
encrypted = encrypt_payload(payload, AES_KEY, AES_IV)

# 3. Send to BSE endpoint
response = requests.post(f"{BSE_BASE_URL}/ucc/addNewUCC", data=encrypted)
print(response.text)


**Option 2: Use as API Gateway (for Postman / Frontend)**  

Start the Flask-based API server:

```bash
python app/main.py

Once the server is running, you can send HTTP requests to the exposed endpoints: (Using Postman)

POST http://127.0.0.1:5000/api/v2/add_ucc
Content-Type: application/json

Sample JSON body:
{
  "clientCode": "X123456",
  "investorName": "John Doe",
  "dob": "1985-06-21",
  "pan": "ABCDE1234F",
  "email": "john@example.com",
  "mobile": "9876543210",
  "address": "101 Elphinstone Road",
  "pincode": "400013",
  "state": "MH",
  "depository_id": "CDSL",
  "dp_id": "12012300",
  "client_id": "00123456",
  "ifsc": "HDFC0001234",
  "account_number": "123456789012",
  "account_type": "Savings",
  "income_slab": "Below 5L",
  "ckyc": "123456789012"
}



---

##  Supported Modules
| Module   | APIs Covered                         |
|----------|--------------------------------------|
| Login    | Token Generate, Validate             |
| UCC      | Add, Get, Update, Deactivate         |
| Order    | Place, Modify, Cancel, GetAll        |
| Payment  | Upload MIS, Get Details              |
| SXP      | Register, Resume, Pause, Cancel      |
| Mandate  | Register, Cancel, Get, Update        |
| NAV      | Fetch NAV, Master Scheme List        |
| 2FA      | Verify Cancel, Link UCC, OTP flows   |

---

##  Encryption & Certificates
- **AES-128 CBC** with **PKCS7** padding
- All encryption is handled in `encrypt_payload()` inside `utils/`
- Optional: Add `.pfx` cert for mutual TLS if mandated by BSE
- KEY and IV must be 16 bytes (128-bit)

---

##  Example: Add UCC Programmatically
```python
from app.models.ucc.addnewucc_request import create_ucc_payload
from app.utils.encrypt import encrypt_payload
from app.config.settings import AES_KEY, AES_IV, BSE_BASE_URL
import requests

data_dict = { "clientCode": "X123456", "investorName": "John Doe", ... }
payload = create_ucc_payload(data_dict)
encrypted = encrypt_payload(payload, AES_KEY, AES_IV)
response = requests.post(f"{BSE_BASE_URL}/ucc/addNewUCC", data=encrypted)
print(response.text)
```

---

##  Use Case: Real-World Scenario
> A broker wants to onboard 100 clients using this wrapper:
- Store investor data in JSON or DB
- Loop over `create_ucc_payload()` per record
- Encrypt → Submit via SDK or API → Monitor response
- Use `/list_ucc` to validate successful registration

---

## Postman / API Testing Guide
- Import all `/api/...` endpoints into Postman
- Ensure server is running: `python main.py`
- Use JSON body format; ensure `Content-Type: application/json`
- Validate that response includes `status: success` and `message`

---

## Common Errors & Fixes
- 🔐 AES padding error → Check if KEY/IV is 16 bytes
- ❌ 500 Internal Server Error → Flask debug mode reveals trace
- ⛔ Route not found → Confirm Flask is running and correct `/api/...` path is used
- ❓ Payload rejected → Validate field names/lengths against BSE spec

---

## FAQs
**Q: Can I use this without Python knowledge?**
A: Yes — run the Flask API and test using Postman.

**Q: Is this safe for production?**
A: Yes — uses standard encryption and can be hosted with Gunicorn + Nginx.

**Q: Can I add more routes?**
A: Yes — create a new service in `/services/` and add a Flask route in `main.py`.

**Q: Does this support 2FA workflows?**
A: Yes — OTP-based routes like `/verify_order_cancel` are included.

---

## 📅 Version
**v1.0.0** — Initial production-grade release (includes UCC, Order, Mandate, NAV, Payment, 2FA modules)