import requests
from config.settings import BASE_URL, LOGIN_ENDPOINT, get_auth_payload

def get_headers(token=None):
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return headers
