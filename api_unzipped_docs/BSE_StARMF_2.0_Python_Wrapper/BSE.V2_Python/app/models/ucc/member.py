class Member:
    def __init__(self, member_id):
        self.member_id = member_id

    def to_dict(self):
        return {"member_id": self.member_id}