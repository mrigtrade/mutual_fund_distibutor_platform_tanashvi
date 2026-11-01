class Depository:
    def __init__(self, depository_code: str, dp_id: str, client_id: str, bank_account: str, account_owner: str, cmbp_id: str):
        self.depository_code = depository_code
        self.dp_id = dp_id
        self.client_id = client_id
        self.bank_account = bank_account
        self.account_owner = account_owner
        self.cmbp_id = cmbp_id

    def to_dict(self):
        return {
            "depository_code": self.depository_code,
            "dp_id": self.dp_id,
            "client_id": self.client_id,
            "bank_account": self.bank_account,
            "account_owner": self.account_owner,
            "cmbp_id": self.cmbp_id
        }
