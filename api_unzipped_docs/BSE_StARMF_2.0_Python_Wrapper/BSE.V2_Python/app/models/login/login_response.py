class LoginResponse:
    def __init__(self, status: str, access_token: str = None, messages: list = None):
        self.status = status
        self.data = {"access_token": access_token} if access_token else None
        self.messages = messages if messages else []

    def to_dict(self):
        return {
            "status": self.status,
            "data": self.data,
            "messages": self.messages
        }
