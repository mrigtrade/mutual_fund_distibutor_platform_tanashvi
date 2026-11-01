class Person:
    def __init__(self, first_name, middle_name, last_name, dob, gender):
        self.first_name = first_name
        self.middle_name = middle_name
        self.last_name = last_name
        self.dob = dob
        self.gender = gender

    def to_dict(self):
        return {
            "first_name": self.first_name,
            "middle_name": self.middle_name,
            "last_name": self.last_name,
            "dob": self.dob,
            "gender": self.gender
        }