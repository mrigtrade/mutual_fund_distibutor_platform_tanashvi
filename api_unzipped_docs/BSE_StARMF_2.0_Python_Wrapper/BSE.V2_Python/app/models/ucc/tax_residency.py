class TaxResidency:
    def __init__(self, country: str, tax_id_no: str, tax_id_type: str):
        self.country = country
        self.tax_id_no = tax_id_no
        self.tax_id_type = tax_id_type

    def to_dict(self):
        return {
            "country": self.country,
            "tax_id_no": self.tax_id_no,
            "tax_id_type": self.tax_id_type
        }
