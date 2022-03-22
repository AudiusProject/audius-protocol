import asyncio
import json
from pathlib import Path
from typing import Any, Dict, List, NoReturn, Optional

from anchorpy import (
    AccountClient,
    Context,
    Idl,
    InstructionCoder,
    Program,
    Provider,
    close_workspace,
    create_workspace,
)
from solana.keypair import Keypair
from solana.publickey import PublicKey
from solana.rpc import types
from solana.rpc.async_api import AsyncClient
from solana.rpc.commitment import Commitment
from solana.system_program import SYS_PROGRAM_ID

AUDIUS_DATA_IDL_PATH = (
    "../../solana-programs/anchor/audius-data/target/idl/audius_data.json"
)
PROVIDER = Provider.local()  # testing
RPC_ADDRESS = "http://localhost:8899"


def get_idl():
    path = Path(AUDIUS_DATA_IDL_PATH)
    with path.open() as f:
        data = json.load(f)
    idl = Idl.from_json(data)
    return idl


def get_account_client(account_name: str):
    # account names: AudiusAdmin, User, Track, Playlist, UserAuthorityDelegate
    idl = get_idl()
    accounts = idl.accounts
    program_id: SYS_PROGRAM_ID
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


def get_account_info(
    account_name: str, account_address: PublicKey, commitment: Commitment
):
    commitment = commitment if commitment else Commitment.Finalized
    account_client = get_account_client(account_name)
    return account_client.fetch(address=account_address, commitment=commitment)


def get_all_accounts_of_type(account_name: str):
    account_client = get_account_client(account_name)
    return account_client.all()


async def call_instruction(instruction_name: str, args: Any) -> NoReturn:
    # Read the deployed program from the workspace.
    workspace = create_workspace(path="../../solana-programs/anchor/audius-data")
    # The program to execute.
    program = workspace["audius_data"]
    # Execute the RPC.
    await program.rpc[instruction_name](args)
    # Close all HTTP clients in the workspace, otherwise we get warnings.
    await close_workspace(workspace)


def is_invalid_tx(response: types.RPCResponse) -> bool:
    # a wrapper over this confusingly named error code https://github.com/michaelhly/solana-py/blob/master/tests/integration/test_http_client.py#L192-L197
    error = response.get("error")
    if error:
        return (
            error["code"] == -32602 and error["message"] == "Invalid param: WrongSize"
        )
    else:
        return False


async def parse_tx(tx_hash: str) -> Dict:
    solana_client = AsyncClient(RPC_ADDRESS)
    tx_info = await solana_client.get_transaction(tx_hash)
    print(tx_info)
    await solana_client.close()
    if is_invalid_tx(tx_info):
        raise Exception("Invalid tx hash")
    idl = get_idl()
    path = Path(AUDIUS_DATA_IDL_PATH)  # not sure why path is needed
    instruction_coder = InstructionCoder(idl)
    tx = tx_info["result"]
    # for instruction in tx["transaction"]["message"]["instructions"]:
    #     context = Context(
    #         accounts=instruction["accounts"], signers=tx["transaction"]["signatures"]
    #     )
    #     slot = tx["slot"]
    #     data = instruction_coder._decode(
    #         (, instruction["data"]), context=context, path=path
    #     )
    # need to find sighash of instruction invoked

    print(tx_info)


async def main(tx_hash):
    await parse_tx(tx_hash)


asyncio.run(
    main(
        "3DRzULtVVBYyKdrgBRBfX4LA5i3xKairNLZBrRAFrCLo7RoVX4HNupHJiPwyJwfw5YNLw1M8xks8EpwV1CARr2dw"
    )
)
