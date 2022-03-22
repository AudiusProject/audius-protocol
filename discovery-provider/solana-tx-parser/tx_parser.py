import asyncio
import json
import os
from pathlib import Path
from typing import Any, Dict, List, NoReturn, Optional

import base58
from anchorpy import (
    AccountClient,
    Context,
    Idl,
    Instruction,
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


def decode(instruction_coder: InstructionCoder, encoded_ix_data: str):
    ix = base58.b58decode(encoded_ix_data)
    ix_sighash = ix[0:8]
    data = ix[8:]
    # print("DECODERS")
    # print(instruction_coder.sighash_layouts)
    # print(ix_sighash)
    decoder = instruction_coder.sighash_layouts.get(ix_sighash)
    if not decoder:
        print(f"No decoder available for {ix_sighash}")
        # raise Exception("No decoder available")
    else:
        return decoder.parse(data)


async def parse_tx(tx_hash: str) -> Dict:
    solana_client = AsyncClient(RPC_ADDRESS)
    tx_info = await solana_client.get_transaction(tx_hash)
    # print(tx_info)
    await solana_client.close()
    if is_invalid_tx(tx_info):
        print(f"Invalid tx hash {tx_hash}")
        return None
        # raise Exception("Invalid tx hash")
    idl = get_idl()
    instruction_coder = InstructionCoder(idl)
    tx = tx_info["result"]
    for instruction in tx["transaction"]["message"]["instructions"]:
        raw_instruction_data = instruction["data"]
        print(
            f"instruction name: {instruction_coder.sighash_to_name.get(base58.b58decode(raw_instruction_data)[0:8])}"
        )  # TODO if there is no name - not supported in IDL - then don't parse it or fail gracefully/log

        # path = Path(AUDIUS_DATA_IDL_PATH)  # not sure why path is needed
        # context = Context(
        #     accounts=instruction["accounts"], signers=tx["transaction"]["signatures"]
        # )
        # slot = tx["slot"]
        # instruction = instruction_coder._decode(
        #     (base58.b58decode(instruction["data"])[0:8], instruction["data"][8:]),
        #     context=context,
        #     path=path,
        # )
        decoded_data = decode(
            instruction_coder=instruction_coder, encoded_ix_data=raw_instruction_data
        )
        print(repr(decoded_data))


async def main(tx_hash):
    tx_hashes = [
        "232MZuGCHXw3kKw2EFrjwV5MEJ5xP2J4f4agerFGmHjELvdrz8NVgf17RAiKVKSbzCRJnopSLmnoZBWKw8BwUpfq"
    ]
    for hash in tx_hashes:
        await parse_tx(hash)


asyncio.run(main(os.getenv("TX_HASH")))
