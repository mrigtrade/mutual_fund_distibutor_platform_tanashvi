class Investor:
    def __init__(self, client_code):
        self.client_code = client_code

    def to_dict(self):
        return {"client_code": self.client_code}