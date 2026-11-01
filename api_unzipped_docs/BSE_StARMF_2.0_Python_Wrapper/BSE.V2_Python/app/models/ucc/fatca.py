class Fatca:
    def __init__(self, holder_rank: str = None, place_of_birth: str = None, country_of_birth: str = None, client_name: str = None, investor_type: str = None, dob: str = None, father_name: str = None, spouse_name: str = None, address_type: str = None, occ_code: str = None, occ_type: str = None, tax_status: str = None, exemption_code: str = None, identifiers = None, corporate_service_sector: str = None, wealth_source: str = None, income_slab: str = None, net_worth: float = None, date_of_net_worth: str = None, politically_exposed: str = None, is_self_declared: bool = None, data_source: str = None, tax_residency=None, ucc_id: str = None, fatca_id: str = None, log_name: str = None):
        self.holder_rank = holder_rank
        self.place_of_birth = place_of_birth
        self.country_of_birth = country_of_birth
        self.client_name = client_name
        self.investor_type = investor_type
        self.dob = dob
        self.father_name = father_name
        self.spouse_name = spouse_name
        self.address_type = address_type
        self.occ_code = occ_code
        self.occ_type = occ_type
        self.tax_status = tax_status
        self.exemption_code = exemption_code
        self.identifiers = Identifiers(**Identifiers) if Identifiers else None
        self.corporate_service_sector = corporate_service_sector
        self.wealth_source = wealth_source
        self.income_slab = income_slab
        self.net_worth = net_worth
        self.date_of_net_worth = date_of_net_worth
        self.politically_exposed = politically_exposed
        self.is_self_declared = is_self_declared
        self.data_source = data_source
        self.tax_residency = [TaxResidency(**tr) for tr in tax_residency] if tax_residency else []
        self.ucc_id = ucc_id
        self.fatca_id = fatca_id
        self.log_name = log_name

    def to_dict(self):
        return {
            "holder_rank": self.holder_rank,
            "place_of_birth": self.place_of_birth,
            "country_of_birth": self.country_of_birth,
            "client_name": self.client_name,
            "investor_type": self.investor_type,
            "dob": self.dob,
            "father_name": self.father_name,
            "spouse_name": self.spouse_name,
            "address_type": self.address_type,
            "occ_code": self.occ_code,
            "occ_type": self.occ_type,
            "tax_status": self.tax_status,
            "exemption_code": self.exemption_code,
            "identifiers": self.identifiers.to_dict() if self.identifiers else None,
            "corporate_service_sector": self.corporate_service_sector,
            "wealth_source": self.wealth_source,
            "income_slab": self.income_slab,
            "net_worth": self.net_worth,
            "date_of_net_worth": self.date_of_net_worth,
            "politically_exposed": self.politically_exposed,
            "is_self_declared": self.is_self_declared,
            "data_source": self.data_source,
            "tax_residency": [tr.to_dict() for tr in self.tax_residency],
            "ucc_id": self.ucc_id,
            "fatca_id": self.fatca_id,
            "log_name": self.log_name
        }
