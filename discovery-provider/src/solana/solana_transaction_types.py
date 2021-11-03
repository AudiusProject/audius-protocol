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
