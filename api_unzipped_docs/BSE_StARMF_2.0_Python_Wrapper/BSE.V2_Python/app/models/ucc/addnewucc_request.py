from .member import Member
from .investor import Investor
from .holder import Holder
from .person import Person
from .contact import Contact
from .nomination import Nomination
from .guardian import Guardian
from .comm_addr import CommAddr
from .depository import Depository
from .bank_account import BankAccount
from .fatca import Fatca
from .identifier import Identifier
from .identifiers import Identifiers
from .tax_residency import TaxResidency


class AddNewUCCRequest:
    def __init__(self, member, investor, holding_nature, tax_code, rdmp_idcw_pay_mode, is_client_physical, is_client_demat, is_nomination_opted, nomination_auth_mode, comm_mode, contact, onboarding, holder, depository, fatca, identifiers, identifier, guardian, comm_addr, bank_account):
        self.member = member
        self.investor = investor
        self.holding_nature = holding_nature
        self.tax_code = tax_code
        self.rdmp_idcw_pay_mode = rdmp_idcw_pay_mode
        self.is_client_physical = is_client_physical
        self.is_client_demat = is_client_demat
        self.is_nomination_opted = is_nomination_opted
        self.nomination_auth_mode = nomination_auth_mode
        self.comm_mode = comm_mode
        self.contact = contact
        self.onboarding = onboarding
        self.holder = holder if holder else []
        self.depository = depository if depository else []
        self.fatca = fatca if fatca else []
        self.identifiers = identifiers if identifiers else []
        self.identifier = identifier if identifier else []
        self.guardian = guardian if guardian else []
        self.comm_addr = comm_addr
        self.bank_account = bank_account if bank_account else []

    def to_dict(self):
        return {
            "data": {
                "member": self.member.to_dict(),
                "investor": self.investor.to_dict(),
                "holding_nature": self.holding_nature,
                "tax_code": self.tax_code,
                "rdmp_idcw_pay_mode": self.rdmp_idcw_pay_mode,
                "is_client_physical": self.is_client_physical,
                "is_client_demat": self.is_client_demat,
                "is_nomination_opted": self.is_nomination_opted,
                "nomination_auth_mode": self.nomination_auth_mode,
                "comm_mode": self.comm_mode,
                "onboarding": self.onboarding,
                "holder": [holder.to_dict() for holder in self.holder],
                "comm_addr": self.comm_addr.to_dict() if self.comm_addr else {},
                "bank_account": [bank.to_dict() for bank in self.bank_account],
                "fatca": [fatca.to_dict() for fatca in self.fatca],
                "identifiers": [identifiers.to_dict() for identifiers in self.identifiers],
                "identifier": [identifier.to_dict() for identifier in self.identifier],
                "guardian": [guardian.to_dict() for guardian in self.guardian],
                "depository": [depository.to_dict() for depository in self.depository],
            }
        }
