import json
from datetime import datetime
from typing import Optional, TypedDict

from typing_extensions import NotRequired

from src.api_helpers import generate_signature
from src.gated_content.gated_content_types import GatedContentType


class PremiumContentSignatureArgs(TypedDict):
    user_id: Optional[int]
    track_id: int
    cid: str
    type: GatedContentType
    is_premium: bool


class PremiumContentSignatureForUserArgs(TypedDict):
    user_id: NotRequired[int]
    user_wallet: str
    track_id: int
    track_cid: str
    type: GatedContentType
    is_premium: bool


class PremiumContentSignature(TypedDict):
    data: str
    signature: str


def _get_current_utc_timestamp_ms():
    return int(datetime.utcnow().timestamp() * 1000)


def get_gated_track_signature(
    track_id: int,
    cid: str,
    is_premium: bool,
    user_wallet: Optional[str],
    user_id: Optional[int],
) -> PremiumContentSignature:
    data = {
        "trackId": track_id,
        "cid": cid,
        "timestamp": _get_current_utc_timestamp_ms(),
    }
    if user_wallet:
        data["user_wallet"] = user_wallet
    if user_id:
        data["userId"] = user_id
    if not is_premium:
        data["shouldCache"] = 1
    signature = generate_signature(data)
    return {"data": json.dumps(data), "signature": signature}


def get_gated_content_signature(
    args: PremiumContentSignatureArgs,
) -> Optional[PremiumContentSignature]:
    if args["type"] == "track":
        return get_gated_track_signature(
            track_id=args["track_id"],
            cid=args["cid"],
            is_premium=args["is_premium"],
            user_wallet=None,
            user_id=args.get("user_id"),
        )
    return None


def get_gated_content_signature_for_user(
    args: PremiumContentSignatureForUserArgs,
) -> Optional[PremiumContentSignature]:
    if args["type"] == "track":
        return get_gated_track_signature(
            track_id=args["track_id"],
            cid=args["track_cid"],
            is_premium=args["is_premium"],
            user_wallet=args["user_wallet"],
            user_id=args.get("user_id"),
        )
    return None
