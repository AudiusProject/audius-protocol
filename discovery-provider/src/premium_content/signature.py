import json
from datetime import datetime
from typing import TypedDict

from src.api_helpers import generate_signature
from src.premium_content.premium_content_types import PremiumContentType


class PremiumContentSignatureData(TypedDict):
    premium_content_id: int
    premium_content_type: PremiumContentType
    user_wallet: str
    timestamp: int


class PremiumContentSignatureArgs(TypedDict):
    id: int
    type: PremiumContentType
    user_wallet: str


class PremiumContentSignature(TypedDict):
    data: str
    signature: str


def _get_current_utc_timestamp_ms():
    return int(datetime.utcnow().timestamp() * 1000)


def get_premium_content_signature(
    args: PremiumContentSignatureArgs,
) -> PremiumContentSignature:
    data: PremiumContentSignatureData = {
        "premium_content_id": args["id"],
        "premium_content_type": args["type"],
        "user_wallet": args["user_wallet"],
        "timestamp": _get_current_utc_timestamp_ms(),
    }
    signature = generate_signature(data)
    return {"data": json.dumps(data), "signature": signature}
