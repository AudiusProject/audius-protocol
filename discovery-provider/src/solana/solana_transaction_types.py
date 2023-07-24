import logging
from typing import Any, List, Optional, TypedDict

logger = logging.getLogger(__name__)


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


class ConfirmedSignatureForAddressResult(TypedDict):
    err: Any
    memo: Any
    signature: str
    slot: int
    blockTime: int
    confirmationStatus: str


class ConfirmedSignatureForAddressResponse(TypedDict):
    jsonrpc: str
    result: List[ConfirmedSignatureForAddressResult]
    id: int
