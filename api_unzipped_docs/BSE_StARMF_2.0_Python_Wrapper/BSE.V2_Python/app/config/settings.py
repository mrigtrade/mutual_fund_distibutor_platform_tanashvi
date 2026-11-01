BASE_URL = "https://starmfv2demo.bseindia.com"
USERNAME = ""
PASSWORD = ""
LOGIN_ENDPOINT = "/api/login"

def get_auth_payload():
    return {
        "data": {
            "username": USERNAME,
            "password": PASSWORD
        }
    }
