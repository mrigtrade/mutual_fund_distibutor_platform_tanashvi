from app.models.ucc.identifier import Identifier

class BankAccount:
    def __init__(self, ifsc_code: str, bank_acc_num: str, bank_acc_type: str, account_owner: str, identifier: list[Identifier]):
        self.ifsc_code = ifsc_code
        self.bank_acc_num = bank_acc_num
        self.bank_acc_type = bank_acc_type
        self.account_owner = account_owner
        self.identifier = [Identifier(**ident) for ident in identifier] if isinstance(identifier, list) else []

    def to_dict(self):
        return {
            "ifsc_code": self.ifsc_code,
            "bank_acc_num": self.bank_acc_num,
            "bank_acc_type": self.bank_acc_type,
            "account_owner": self.account_owner,
            "identifier": [ident.to_dict() for ident in self.identifier]
        }
