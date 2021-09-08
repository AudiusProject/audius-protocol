import enum
import logging
from typing import Dict, List, TypedDict

import base58

logger = logging.getLogger(__name__)


class SolanaInstructionType(str, enum.Enum):
    u64 = "u64"
    string = "string"
    EthereumAddress = "EthereumAddress"
    UnixTimestamp = "UnixTimestamp"


solanaInstructionSpace = {
    SolanaInstructionType.u64: 8,
    SolanaInstructionType.string: 4,
    SolanaInstructionType.EthereumAddress: 20,
    SolanaInstructionType.UnixTimestamp: 8,
}


class InstructionFormat(TypedDict):
    name: str
    type: SolanaInstructionType


def parse_instruction_data(data: str, instructionFormat: List[InstructionFormat]):
    """Parses encoded instruction data into a dictionary based on instruction format"""
    decoded = base58.b58decode(data)[1:]
    last_end = 0
    decoded_params: Dict = {}
    for intr in instructionFormat:
        name = intr["name"]
        type = intr["type"]

        if type == SolanaInstructionType.u64:
            type_len = solanaInstructionSpace[type]
            decoded_params[name] = int.from_bytes(
                decoded[last_end : last_end + type_len], "little"
            )
            last_end = last_end + type_len
        elif type == SolanaInstructionType.string:
            type_len = solanaInstructionSpace[type]
            instr_len = int.from_bytes(
                decoded[last_end : last_end + type_len], "little"
            )
            start, end = last_end + type_len, last_end + type_len + instr_len
            decoded_value: bytes = decoded[start:end]
            decoded_params[name] = str(decoded_value, "utf-8")
            last_end = end
        elif type == SolanaInstructionType.EthereumAddress:
            type_len = solanaInstructionSpace[type]
            decoded_int = int.from_bytes(decoded[last_end : last_end + type_len], "big")
            # Ensure stored address is of length 40 characters
            # Pads zeros if present at start of string
            decoded_params[name] = "0x{:040x}".format(decoded_int)
            last_end = last_end + type_len
        elif type == SolanaInstructionType.UnixTimestamp:
            type_len = solanaInstructionSpace[type]
            decoded_params[name] = int.from_bytes(
                decoded[last_end : last_end + type_len], "little"
            )
            last_end = last_end + type_len

    return decoded_params
