import asyncio
import os
from typing import Dict, List, Optional

import base58
from anchorpy import InstructionCoder
from construct import Container
from utils import fetch_tx_receipt, get_all_txs_for_program, get_idl


def decode_instruction_data(
    encoded_ix_data: str, instruction_coder: InstructionCoder
) -> Optional[Container]:
    ix = base58.b58decode(encoded_ix_data)
    ix_sighash = ix[0:8]
    data = ix[8:]
    decoder = instruction_coder.sighash_layouts.get(ix_sighash)
    if not decoder:
        print(f"No decoder available for {ix_sighash}")
        return None
    else:
        decoded_data = decoder.parse(data)
        print(f"Transaction data: {repr(decoded_data)}")
        return decoded_data


def get_instruction_name(
    encoded_ix_data: str, instruction_coder: InstructionCoder
) -> str:
    idl_instruction_name = instruction_coder.sighash_to_name.get(
        base58.b58decode(encoded_ix_data)[0:8]
    )
    print(f"Instruction name: {idl_instruction_name}")
    if idl_instruction_name == None:
        print(f"No instruction found in idl matching {idl_instruction_name}")
        return ""
    return idl_instruction_name


# Maps account indices for ix context to pubkeys
def get_instruction_context_accounts(
    all_account_keys: List[str], instruction: Dict
) -> List[str]:
    account_indices = instruction.get("accounts")
    return [all_account_keys[acct_idx] for acct_idx in account_indices]


def parse_instruction(
    instruction: Dict, instruction_coder: InstructionCoder, account_keys: List[str]
) -> Dict:
    encoded_ix_data = instruction.get("data")
    idl_instruction_name = get_instruction_name(
        encoded_ix_data=encoded_ix_data,
        instruction_coder=instruction_coder,
    )
    account_addresses = get_instruction_context_accounts(account_keys, instruction)
    decoded_data = decode_instruction_data(
        encoded_ix_data=encoded_ix_data,
        instruction_coder=instruction_coder,
    )
    return {
        "data": decoded_data,
        "instruction_name": idl_instruction_name,
        "accounts": account_addresses,
    }


async def parse_tx(tx_hash: str) -> List[Dict]:
    parsed_instructions = []
    tx_info = await fetch_tx_receipt(tx_hash)
    if tx_info is not None:
        idl = get_idl()
        instruction_coder = InstructionCoder(idl)
        message = tx_info.get("transaction").get("message")
        instructions = message.get("instructions")
        account_keys = message.get("accountKeys")

        for instruction in instructions:
            ix_data = parse_instruction(
                instruction=instruction,
                instruction_coder=instruction_coder,
                account_keys=account_keys,
            )
            parsed_instructions.append(ix_data)
    return parsed_instructions


async def main(tx_hash):
    tx_hashes = []
    if tx_hash:
        tx_hashes.append(tx_hash)
    else:
        tx_hashes = await get_all_txs_for_program()
    for hash in tx_hashes:
        print(f"Parsing tx {hash}")
        parsed_tx = await parse_tx(hash)
        print(f"Parsed tx: {parsed_tx}")


asyncio.run(main(os.getenv("TX_HASH")))
