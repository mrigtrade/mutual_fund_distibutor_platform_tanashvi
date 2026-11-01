import requests
from config.settings import BASE_URL
from services.login.login_service import LoginService

class SendPaymentInfoService:
    @staticmethod
    def send_payment_info(request_payload):
        url = f"{BASE_URL}/send_payment_info"  # PDF endpoint (verify)
        access = LoginService.get_access_token()
        token = access.get("data", {}).get("access_token")
        if not token:
            return {"status": "error", "messages": [{"msg": "missing_token"}]}

        payload = request_payload.copy() if request_payload else {"data": {}}
        data = payload.get("data", {})

        # Notable BSE changes: no return_url; uses redirection_url and exch_mandate_id in payment_details.
        # Ensure payment_mode array:
        if "payment_mode" in data and not isinstance(data["payment_mode"], list):
            data["payment_mode"] = [data["payment_mode"]]

        payload["data"] = data

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}"
        }

        resp = requests.post(url, json=payload, headers=headers, timeout=30)
        try:
            return resp.json()
        except ValueError:
            return {"status": "error", "messages": [{"msg": "invalid_json_from_bse", "raw": resp.text}]}
