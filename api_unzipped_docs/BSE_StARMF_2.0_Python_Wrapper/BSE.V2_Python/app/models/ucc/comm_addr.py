class CommAddr:
    def __init__(self, address_line_1, address_line_2, address_line_3, comm_mode, postalcode, address_id):
        self.address_line_1 = address_line_1
        self.address_line_2 = address_line_2
        self.address_line_3 = address_line_3
        self.comm_mode = comm_mode
        self.postalcode = postalcode
        self.address_id = address_id

    def to_dict(self):
        return {
            "address_line_1": self.address_line_1,
            "address_line_2": self.address_line_2,
            "address_line_3": self.address_line_3,
            "comm_mode": self.comm_mode,
            "postalcode": self.postalcode,
            "address_id": self.address_id
        }
