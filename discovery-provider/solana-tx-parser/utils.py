import json
from pathlib import Path
from typing import Dict, List, Optional

from anchorpy import Idl
from constants import AUDIUS_DATA_IDL_PATH, RPC_ADDRESS
from solana.rpc import types
from solana.rpc.async_api import AsyncClient
from solana.system_program import SYS_PROGRAM_ID


def get_idl() -> Idl:
    path = Path(AUDIUS_DATA_IDL_PATH)
    with path.open() as f:
        data = json.load(f)
    idl = Idl.from_json(data)
    return idl


def is_invalid_tx(response: types.RPCResponse) -> bool:
    # a wrapper over this confusingly named error code https://github.com/michaelhly/solana-py/blob/master/tests/integration/test_http_client.py#L192-L197
    error = response.get("error")
    if error:
        return (
            error["code"] == -32602 and error["message"] == "Invalid param: WrongSize"
        )
    else:
        return False


async def fetch_tx_receipt(tx_hash: str) -> Optional[Dict]:
    solana_client = AsyncClient(RPC_ADDRESS)
    tx_info = await solana_client.get_transaction(tx_hash)
    print(f"Tx info for {tx_hash}: {json.dumps(tx_info, indent=4)}")
    await solana_client.close()
    if is_invalid_tx(tx_info):
        print(f"Invalid tx hash: {tx_hash}")
    return tx_info.get("result")


async def get_all_txs_for_program(program_id: Optional[str]) -> List[Dict]:
    program_id = program_id if program_id else SYS_PROGRAM_ID
    solana_client = AsyncClient(RPC_ADDRESS)
    txs = await solana_client.get_signatures_for_address(account=program_id)
    hashes = [tx.get("signature") for tx in txs.get("result")]
    print(f"Retrieved {len(hashes)} txs for program ID {program_id}.")
    await solana_client.close()
    return hashes
