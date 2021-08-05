import enum
import logging
from typing import Optional, List, Dict, TypedDict, Any
import base58
from solana.rpc.api import Client

logger = logging.getLogger(__name__)

# ============== Solana Transaction Types ==============
class TransactionMessageHeader(TypedDict):
    numReadonlySignedAccounts: int  # num read only signed
    numReadonlyUnsignedAccounts: int  # num read only unsigned
    numRequiredSignatures: int  # num required signature


class TransactionMessageInstruction(TypedDict):
    accounts: List[int]  # list of solana accounts keys
    data: str  # encoded tnstruction data
    programIdIndex: int  # index of program in accounts


class TransactionMessage(TypedDict):
    accountKeys: List[str]
    header: TransactionMessageHeader
    instructions: List[TransactionMessageInstruction]
    recentBlockhash: str


class ResultTransction(TypedDict):
    message: TransactionMessage
    signatures: List[str]


class MetaInnerInstructionData(TypedDict):
    accounts: List[int]
    data: str
    programIdIndex: int


class MetaInnerInstruction(TypedDict):
    index: int
    instruction: List[TransactionMessageInstruction]


class UiTokenAmount(TypedDict):
    amount: str
    decimals: int
    uiAmount: float
    uiAmountString: str


class TokenBalance(TypedDict):
    accountIndex: int
    mint: str
    uiTokenAmount: UiTokenAmount


class ResultMeta(TypedDict):
    err: Optional[Any]
    fee: int
    innerInstructions: List[MetaInnerInstruction]
    logMessages: List[str]
    preBalances: List[int]
    postBalances: List[int]
    preTokenBalances: List[TokenBalance]
    postTokenBalances: List[TokenBalance]
    uiTokenAmount: UiTokenAmount
    rewards: List[Any]
    status: Any


class TransactionInfoResult(TypedDict):
    blockTime: int
    meta: ResultMeta
    slot: int
    transaction: ResultTransction


# ============== Solana Instruction Parsing Helpers ==============


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
        name: str = intr["name"]
        type: SolanaInstructionType = intr["type"]

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
            decoded_params[name] = str(decoded_value)
            last_end = end
        elif type == SolanaInstructionType.EthereumAddress:
            type_len = solanaInstructionSpace[type]
            decoded_params[name] = hex(
                int.from_bytes(decoded[last_end : last_end + type_len], "little")
            )
            last_end = last_end + type_len
        elif type == SolanaInstructionType.UnixTimestamp:
            type_len = solanaInstructionSpace[type]
            decoded_params[name] = int.from_bytes(
                decoded[last_end : last_end + type_len], "little"
            )
            last_end = last_end + type_len

    return decoded_params


# ============== Solana Fetch Transaction Info Helpers ==============


def get_sol_tx_info(solana_client: Client, tx_sig: str, retries=5):
    """Fetches a solana transaction by signature with retries

    If not found, raise an exception
    """
    while retries > 0:
        try:
            tx_info = solana_client.get_confirmed_transaction(tx_sig)
            if tx_info["result"] is not None:
                return tx_info
        except Exception as e:
            logger.error(
                f"get_sol_tx_info | Error fetching tx {tx_sig}, {e}",
                exc_info=True,
            )
        retries -= 1
        logger.error(f"get_sol_tx_info | Retrying tx fetch: {tx_sig}")
    raise Exception(f"get_sol_tx_info | Failed to fetch {tx_sig}")
