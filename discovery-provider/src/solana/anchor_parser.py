from typing import Container, Dict, List, Optional

import base58
from anchorpy import InstructionCoder
from solana.transaction import TransactionInstruction
from src.solana.solana_parser import InstructionFormat


def decode_instruction_data(
    encoded_ix_data: bytes, instruction_coder: InstructionFormat
) -> Optional[Container]:
    ix = base58.b58decode(encoded_ix_data)
    ix_sighash = ix[0:8]
    data = ix[8:]
    decoder = instruction_coder.sighash_layouts.get(ix_sighash)
    if not decoder:
        return None
    else:
        decoded_data = decoder.parse(data)
        return decoded_data


# Maps account indices for ix context to pubkeys
def get_instruction_context_accounts(
    instruction: TransactionInstruction,
) -> List[str]:
    return [str(account_meta.pubkey) for account_meta in instruction.keys]


def get_instruction_name(
    encoded_ix_data: bytes, instruction_coder: InstructionCoder
) -> Optional[str]:
    idl_instruction_name = instruction_coder.sighash_to_name.get(
        base58.b58decode(encoded_ix_data)[0:8]
    )
    if idl_instruction_name == None:
        return ""
    return idl_instruction_name


def parse_instruction(
    instruction: TransactionInstruction, instruction_coder: InstructionCoder
) -> Dict:
    encoded_ix_data = base58.b58encode(instruction.data)
    idl_instruction_name = get_instruction_name(encoded_ix_data, instruction_coder)
    account_addresses = get_instruction_context_accounts(instruction)
    decoded_data = decode_instruction_data(encoded_ix_data, instruction_coder)
    return {
        "instruction_name": idl_instruction_name,
        "accounts": account_addresses,
        "data": decoded_data,
    }
