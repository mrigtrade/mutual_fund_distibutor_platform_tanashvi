class LoginRequest:
    def __init__(self, username, password):
        self.data = {"username": username, "password": password}
    
    def to_json(self):
        return {"data": self.data}