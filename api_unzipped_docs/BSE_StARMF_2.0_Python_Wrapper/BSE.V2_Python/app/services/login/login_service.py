import requests
from config.settings import BASE_URL, LOGIN_ENDPOINT, USERNAME, PASSWORD
from utils.helpers import get_headers
from models.login.login_response import LoginResponse

class LoginService:
    @staticmethod
    def login():
        """
        Authenticates the user and retrieves an access token.
        """
        url = f"{BASE_URL}{LOGIN_ENDPOINT}"
        payload = {"data": {"username": USERNAME, "password": PASSWORD}}
        headers = get_headers()

        try:
            response = requests.post(url, json=payload, headers=headers, verify=False)
            response_data = response.json()

            if response.status_code == 200 and "data" in response_data:
                access_token = response_data["data"].get("access_token")
                if access_token:
                    return LoginResponse(status="success", access_token=access_token).to_dict()
            
            return LoginResponse(
                status="error",
                messages=[response_data.get("message", "Login failed!")]
            ).to_dict()

        except requests.exceptions.RequestException as e:
            return LoginResponse(
                status="error",
                messages=[f"Request failed: {str(e)}"]
            ).to_dict()
    
    @staticmethod
    def get_access_token():
        """
        Retrieves the access token by calling the login method.
        """
        login_response = LoginService.login()
        
        if login_response.get("status") == "success":
            return login_response
        
        raise ValueError("Failed to retrieve access token")

