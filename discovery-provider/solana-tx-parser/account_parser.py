from typing import Any, Optional

from anchorpy import AccountClient, Program, ProgramAccount
from constants import PROVIDER
from construct import Container
from solana.publickey import PublicKey
from solana.rpc.commitment import Commitment
from solana.system_program import SYS_PROGRAM_ID
from utils import get_idl


def get_account_client(account_name: str) -> AccountClient:
    # account names: AudiusAdmin, User, Track, Playlist, UserAuthorityDelegate
    idl = get_idl()
    accounts = idl.accounts
    program_id = SYS_PROGRAM_ID
    provider = PROVIDER
    idl_account = next((acct for acct in accounts if acct.name == account_name), None)
    program = Program(idl=idl, program_id=program_id, provider=provider)
    account_client = AccountClient(
        idl=idl,
        idl_account=idl_account,
        coder=program.coder,
        program_id=program_id,
        provider=provider,
    )
    return account_client


# A POC for getting account info through anchorpy.
def get_account_info(
    account_name: str, account_address: PublicKey, commitment: Optional[Commitment]
) -> Container[Any]:
    commitment = commitment if commitment else Commitment.Finalized
    account_client = get_account_client(account_name)
    return account_client.fetch(address=account_address, commitment=commitment)


def get_all_accounts_of_type(account_name: str) -> list[ProgramAccount]:
    account_client = get_account_client(account_name)
    return account_client.all()
