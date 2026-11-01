from .member import Member
from .investor import Investor

class GetUCCRequest:
    def __init__(self, member, investor):
        self.member = member
        self.investor = investor

    def to_dict(self):
        return {
            "data": {
                "member": self.member.to_dict(),
                "investor": self.investor.to_dict()
            }
        }