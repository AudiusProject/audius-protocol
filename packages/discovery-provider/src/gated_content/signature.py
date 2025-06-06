import json
from datetime import datetime
from typing import Optional, TypedDict

from typing_extensions import NotRequired

from src.gated_content.types import GatedContentType
from src.utils.helpers import generate_signature


class GatedContentSignatureArgs(TypedDict):
    user_id: Optional[int]
    track_id: int
    cid: str
    type: GatedContentType
    is_gated: bool


class GatedContentSignatureForUserWalletArgs(TypedDict):
    user_id: NotRequired[int]
    user_wallet: str
    track_id: int
    track_cid: str
    type: GatedContentType
    is_gated: bool


class GatedContentSignature(TypedDict):
    data: str
    signature: str


def _get_current_utc_timestamp_ms():
    return int(datetime.utcnow().timestamp() * 1000)


def _get_gated_track_signature(
    track_id: int,
    cid: str,
    is_gated: bool,
    user_wallet: Optional[str],
    user_id: Optional[int],
) -> GatedContentSignature:
    data = {
        "trackId": track_id,
        "cid": cid,
        "timestamp": _get_current_utc_timestamp_ms(),
    }
    if user_wallet:
        data["user_wallet"] = user_wallet
    if user_id:
        data["userId"] = user_id
    if not is_gated:
        data["shouldCache"] = 1
    signature = generate_signature(data)
    return {"data": json.dumps(data), "signature": signature}


def get_gated_content_signature(
    args: GatedContentSignatureArgs,
) -> Optional[GatedContentSignature]:
    if args["type"] == "track":
        return _get_gated_track_signature(
            track_id=args["track_id"],
            cid=args["cid"],
            is_gated=args["is_gated"],
            user_wallet=None,
            user_id=args.get("user_id"),
        )
    return None


# This is a similar signature generation function, whose data includes the user's wallet.
# This is used for the case where the user passes in an existing gated content signature
# (e.g. from track request or nft request) when requesting to stream or download,
# in which case we make sure the requesting user has the wallet as the user wallet in the signature.
def get_gated_content_signature_for_user_wallet(
    args: GatedContentSignatureForUserWalletArgs,
) -> Optional[GatedContentSignature]:
    if args["type"] == "track":
        return _get_gated_track_signature(
            track_id=args["track_id"],
            cid=args["track_cid"],
            is_gated=args["is_gated"],
            user_wallet=args["user_wallet"],
            user_id=args.get("user_id"),
        )
    return None
