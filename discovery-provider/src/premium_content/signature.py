import json
from datetime import datetime
from typing import TypedDict, Union

from src.api_helpers import generate_signature
from src.premium_content.premium_content_types import PremiumContentType


class PremiumContentSignatureArgs(TypedDict):
    id: Union[
        int, str
    ]  # because we sign track CID for premium tracks, but may sign integer ids for other premium content types
    type: PremiumContentType
    is_premium: bool


class PremiumContentSignatureArgsForUser(TypedDict):
    user_wallet: str
    id: Union[
        int, str
    ]  # because we sign track CID for premium tracks, but may sign integer ids for other premium content types
    type: PremiumContentType
    is_premium: bool


class PremiumContentSignature(TypedDict):
    data: str
    signature: str


def _get_current_utc_timestamp_ms():
    return int(datetime.utcnow().timestamp() * 1000)


def get_premium_content_signature(
    args: PremiumContentSignatureArgs,
) -> PremiumContentSignature:
    data = {
        "premium_content_id": args["id"],
        "premium_content_type": args["type"],
        "timestamp": _get_current_utc_timestamp_ms(),
    }
    if not args["is_premium"]:
        data["cache"] = 1
    signature = generate_signature(data)
    return {"data": json.dumps(data), "signature": signature}


def get_premium_content_signature_for_user(
    args: PremiumContentSignatureArgsForUser,
) -> PremiumContentSignature:
    data = {
        "user_wallet": args["user_wallet"],
        "premium_content_id": args["id"],
        "premium_content_type": args["type"],
        "timestamp": _get_current_utc_timestamp_ms(),
    }
    if not args["is_premium"]:
        data["cache"] = 1
    signature = generate_signature(data)
    return {"data": json.dumps(data), "signature": signature}
