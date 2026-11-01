import requests
from services.login.auth_service import AuthService
from utils.helpers import get_headers
from config.settings import BASE_URL

class APIService:
    access_token = None

    @classmethod
    def call_api(cls, endpoint, request_object):
        if cls.access_token is None:
            cls.access_token = AuthService.login()

        url = f"{BASE_URL}{endpoint}"
        headers = get_headers(cls.access_token)
        response = requests.post(url, json=request_object.to_json(), headers=headers)

        return response.json()
