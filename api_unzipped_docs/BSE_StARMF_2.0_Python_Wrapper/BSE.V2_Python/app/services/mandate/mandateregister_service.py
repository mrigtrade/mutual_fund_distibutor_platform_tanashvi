import requests
from config.settings import BASE_URL
from services.login.login_service import LoginService

class MandateRegisterService:
    @staticmethod
    def mandate_register(data):
        url = f"{BASE_URL}/api/mandate_register"
        access_token = LoginService.get_access_token()

        token = access_token.get("data", {}).get("access_token")

        if not token:
            raise ValueError("Access token is missing or invalid")

        payload = data

        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }

        response = requests.post(url, json=payload, headers=headers, verify=False)

        print(f"Response Status Code: {response.status_code}")
        print(f"Response Text: {response.text}")

        if response.status_code != 200:
            return {
                "error": f"API request failed with status {response.status_code}",
                "response_text": response.json()
            }

        try:
            return response.json()
        except requests.exceptions.JSONDecodeError:
            return {"error": "Invalid JSON response from server", "response_text": response.text}
