class Nomination:
    def __init__(self, person, nomination_percent, nomination_relation, is_minor):
        self.person = person
        self.nomination_percent = nomination_percent
        self.nomination_relation = nomination_relation
        self.is_minor = is_minor

    def to_dict(self):
        return {
            "person": self.person.to_dict(),
            "nomination_percent": self.nomination_percent,
            "nomination_relation": self.nomination_relation,
            "is_minor": self.is_minor
        }