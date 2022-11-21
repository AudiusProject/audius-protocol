import json
from datetime import datetime
from typing import Optional, TypedDict, Union, cast

from src.api_helpers import generate_signature
from src.premium_content.premium_content_types import PremiumContentType


class PremiumContentSignatureArgs(TypedDict):
    id: Union[int, str]
    type: PremiumContentType
    is_premium: bool


class PremiumContentSignatureForUserArgs(TypedDict):
    user_wallet: str
    id: Union[int, str]
    type: PremiumContentType
    is_premium: bool


class PremiumContentSignature(TypedDict):
    data: str
    signature: str


def _get_current_utc_timestamp_ms():
    return int(datetime.utcnow().timestamp() * 1000)


def get_premium_track_signature(
    cid: str, is_premium: bool, user_wallet: Optional[str]
) -> PremiumContentSignature:
    data = {
        "cid": cid,
        "timestamp": _get_current_utc_timestamp_ms(),
    }
    if user_wallet:
        data["user_wallet"] = user_wallet
    if not is_premium:
        data["shouldCache"] = 1
    signature = generate_signature(data)
    return {"data": json.dumps(data), "signature": signature}


def get_premium_content_signature(
    args: PremiumContentSignatureArgs,
) -> Optional[PremiumContentSignature]:
    if args["type"] == "track":
        return get_premium_track_signature(
            cid=cast(str, args["id"]), is_premium=args["is_premium"], user_wallet=None
        )
    return None


def get_premium_content_signature_for_user(
    args: PremiumContentSignatureForUserArgs,
) -> Optional[PremiumContentSignature]:
    if args["type"] == "track":
        return get_premium_track_signature(
            cid=cast(str, args["id"]),
            is_premium=args["is_premium"],
            user_wallet=args["user_wallet"],
        )
    return None
