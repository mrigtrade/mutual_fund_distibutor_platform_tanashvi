import requests
from config.settings import BASE_URL
from services.login.login_service import LoginService

class GetExchPgService:
    @staticmethod
    def get_exchpg_service(request_payload):
        url = f"{BASE_URL}/get_exchpg_service"   # PDF endpoint path (verify)
        # token
        access = LoginService.get_access_token()
        token = access.get("data", {}).get("access_token")
        if not token:
            return {"status": "error", "messages": [{"msg": "missing_token"}]}

        # defensive copy
        payload = request_payload.copy() if request_payload else {"data": {}}
        payload_data = payload.get("data", {})

        # backwards compat: support request_method -> requested_method
        if "request_method" in payload_data and "requested_method" not in payload_data:
            payload_data["requested_method"] = payload_data.pop("request_method")

        # ensure payment_mode is list
        if "payment_mode" in payload_data and not isinstance(payload_data["payment_mode"], list):
            payload_data["payment_mode"] = [payload_data["payment_mode"]]

        payload["data"] = payload_data

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}"
        }

        resp = requests.post(url, json=payload, headers=headers, timeout=30)
        try:
            return resp.json()
        except ValueError:
            return {"status": "error", "messages": [{"msg": "invalid_json_from_bse", "raw": resp.text}]}
