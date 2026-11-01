class Identifiers:
    def __init__(self, identifier_type: str = None, identifier_number: str = None, issue_date: str = None, expiry_date: str = None, file_name: str = None, file_size: str = None, file_blob: str = None, additional_info: str = None, is_active: bool = None):
        self.identifier_type = identifier_type
        self.identifier_number = identifier_number
        self.issue_date = issue_date
        self.expiry_date = expiry_date
        self.file_name = file_name
        self.file_size = file_size
        self.file_blob = file_blob
        self.additional_info = additional_info
        self.is_active = is_active

    def to_dict(self):
        return {
            "identifier_type": self.identifier_type,
            "identifier_number": self.identifier_number,
            "issue_date": self.issue_date,
            "expiry_date": self.expiry_date,
            "file_name": self.file_name,
            "file_size": self.file_size,
            "file_blob": self.file_blob,
            "additional_info": self.additional_info,
            "is_active": self.is_active
        }
