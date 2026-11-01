class Contact:
    def __init__(self, contact_number: str, country_code: str, whose_contact_number: str, email_address: str, whose_email_address: str, contact_type: str, is_foreign: bool):
        self.contact_number = contact_number
        self.country_code = country_code
        self.whose_contact_number = whose_contact_number
        self.email_address = email_address
        self.whose_email_address = whose_email_address
        self.contact_type = contact_type
        self.is_foreign = is_foreign

    def to_dict(self):
        return {
            "contact_number": self.contact_number,
            "country_code": self.country_code,
            "whose_contact_number": self.whose_contact_number,
            "email_address": self.email_address,
            "whose_email_address": self.whose_email_address,
            "contact_type": self.contact_type,
            "is_foreign": self.is_foreign
        }
