class Holder:
    def __init__(self, holder_name: str = None, holder_pan: str = None, holder_dob: str = None, holder_rank: str = None, occ_code: str = None, auth_mode: str = None, is_pan_exempt: bool = None, pan_exempt_category: str = None, kyc_type: str = None, ckyc_number: str = None, person=None, identifier=None, nomination=None, contact=None, is_pan_verified: bool = None):
        self.holder_name = holder_name
        self.holder_pan = holder_pan
        self.holder_dob = holder_dob
        self.holder_rank = holder_rank
        self.occ_code = occ_code
        self.auth_mode = auth_mode
        self.is_pan_exempt = is_pan_exempt
        self.pan_exempt_category = pan_exempt_category
        self.kyc_type = kyc_type
        self.ckyc_number = ckyc_number
        self.person = person if person else {}
        self.identifier = identifier if identifier else []
        self.nomination = nomination if nomination else []
        self.contact = contact if contact else []
        self.is_pan_verified = is_pan_verified

    def to_dict(self):
        return {
            "holder_name": self.holder_name,
            "holder_pan": self.holder_pan,
            "holder_dob": self.holder_dob,
            "holder_rank": self.holder_rank,
            "occ_code": self.occ_code,
            "auth_mode": self.auth_mode,
            "is_pan_exempt": self.is_pan_exempt,
            "pan_exempt_category": self.pan_exempt_category,
            "kyc_type": self.kyc_type,
            "ckyc_number": self.ckyc_number,
            "person": self.person,
            "identifier": [id.to_dict() for id in self.identifier],
            "nomination": [nom.to_dict() for nom in self.nomination],
            "contact": [con.to_dict() for con in self.contact],
            "is_pan_verified": self.is_pan_verified 
        }
