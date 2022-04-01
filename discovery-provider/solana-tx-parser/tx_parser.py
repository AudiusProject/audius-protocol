import asyncio
import base64
import os
from typing import Dict, List, Optional

import base58
from anchorpy import InstructionCoder
from construct import Container
from solana.transaction import Transaction, TransactionInstruction
from utils import fetch_tx_receipt, get_all_txs_for_program, get_idl


def decode_instruction_data(
    encoded_ix_data: bytes, instruction_coder: InstructionCoder
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
    encoded_ix_data: bytes, instruction_coder: InstructionCoder
) -> Optional[str]:
    idl_instruction_name = instruction_coder.sighash_to_name.get(
        base58.b58decode(encoded_ix_data)[0:8]
    )
    print(f"Instruction name: {idl_instruction_name}")
    if idl_instruction_name == None:
        print(f"No instruction found in idl matching {idl_instruction_name}")
        return ""
    return idl_instruction_name


# Maps account indices for ix context to pubkeys
def get_instruction_context_accounts(instruction: TransactionInstruction) -> List[str]:
    return [str(account_meta.pubkey) for account_meta in instruction.keys]


def parse_instruction(
    instruction: TransactionInstruction, instruction_coder: InstructionCoder
) -> Dict:
    encoded_ix_data = base58.b58encode(instruction.data)
    idl_instruction_name = get_instruction_name(
        encoded_ix_data=encoded_ix_data,
        instruction_coder=instruction_coder,
    )
    account_addresses = get_instruction_context_accounts(instruction)
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
        encoded_data = tx_info.get("transaction")[0]
        encoded_data_hex = base64.b64decode(encoded_data).hex()
        res = Transaction.deserialize(bytes.fromhex(encoded_data_hex))

        for instruction in res.instructions:
            ix_data = parse_instruction(
                instruction=instruction, instruction_coder=instruction_coder
            )
            parsed_instructions.append(ix_data)
    return parsed_instructions


async def main(tx_hash):
    tx_hashes = []
    parsed_txs = []
    program_id = get_idl().metadata.address
    if len(tx_hash):
        tx_hashes.append(tx_hash)
    else:
        tx_hashes = await get_all_txs_for_program(program_id)
    for hash in tx_hashes:
        print(f"Parsing tx {hash}\n")
        parsed_tx = await parse_tx(hash)
        parsed_txs.append(parsed_tx)
        print(f"\nParsed tx {hash}:\n\n{parsed_tx}")
    print(f"\nParsed {len(parsed_txs)} txs.")


asyncio.run(main(os.getenv("TX_HASH")))
