class Guardian:
    def __init__(self, guardian_data: dict):
        self.first_name = guardian_data.get("first_name", "")
        self.middle_name = guardian_data.get("middle_name", "")
        self.last_name = guardian_data.get("last_name", "")
        self.dob = guardian_data.get("dob", "")
        self.guardian_pan = guardian_data.get("guardian_pan", "")
        self.is_pan_exempt = guardian_data.get("is_pan_exempt", False)
        self.pan_exempt_category = guardian_data.get("pan_exempt_category", "")

    def to_dict(self):
        return {
            "first_name": self.first_name,
            "middle_name": self.middle_name,
            "last_name": self.last_name,
            "dob": self.dob,
            "guardian_pan": self.guardian_pan,
            "is_pan_exempt": self.is_pan_exempt,
            "pan_exempt_category": self.pan_exempt_category
        }
