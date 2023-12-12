import json
import urllib.parse
from typing import Dict, Optional, TypedDict

from src.gated_content.gated_content_access_checker import gated_content_access_checker
from src.gated_content.signature import get_gated_content_signature
from src.models.tracks.track import Track
from src.queries.get_authed_user import get_authed_user
from src.utils import db_session


class GetTrackStreamSignature(TypedDict):
    track: Track
    cid: str
    is_preview: Optional[bool]
    is_download: Optional[bool]
    user_data: Optional[str]
    user_signature: Optional[str]
    premium_content_signature: Optional[str]


def get_track_stream_signature(args: Dict):
    track = args["track"]
    cid = args["cid"]
    is_preview = args.get("is_preview", False)
    is_premium = track["is_premium"]
    is_download_gated = track["is_download_gated"]

    is_download = args.get("is_download", False)
    is_stream = not is_download

    authed_user_id = None

    user_data = args["user_data"]
    user_signature = args["user_signature"]

    if user_data and user_signature:
        authed_user = get_authed_user(user_data, user_signature)
        authed_user_id = authed_user.get("user_id") if authed_user else None

    # all track previews should be publicly available
    # same for streams that are not gated
    # same for downloads that are not gated
    if (
        is_preview
        or (is_stream and not is_premium)
        or (is_download and not is_download_gated)
    ):
        return get_gated_content_signature(
            {
                "track_id": track["track_id"],
                "cid": cid,
                "type": "track",
                "user_id": authed_user_id,
                "is_premium": False,
            }
        )

    if not authed_user_id:
        return None

    premium_content_signature = args["premium_content_signature"]
    if premium_content_signature:
        # check that authed user is the same as user for whom the gated content signature was signed
        premium_content_signature_obj = json.loads(
            urllib.parse.unquote(premium_content_signature)
        )
        signature_data = json.loads(premium_content_signature_obj["data"])

        if (
            signature_data.get("user_wallet", False)
            != authed_user["user_wallet"].lower()
            or signature_data.get("cid", False) != cid
            or signature_data.get("shouldCache", False)
        ):
            return None
        return premium_content_signature_obj
    else:
        # build a track instance from the track dict
        track_entity = Track(
            track_id=track["track_id"],
            is_premium=is_premium,
            premium_conditions=track["premium_conditions"],
            is_download_gated=is_download_gated,
            download_conditions=track["download_conditions"],
            owner_id=track["owner_id"],
        )
        db = db_session.get_db_read_replica()
        with db.scoped_session() as session:
            access = gated_content_access_checker.check_access(
                session=session,
                user_id=authed_user["user_id"],
                premium_content_id=track_entity.track_id,
                premium_content_type="track",
                premium_content_entity=track_entity,
                is_download=is_download
            )
            if not access["does_user_have_access"]:
                return None

    return get_gated_content_signature(
        {
            "track_id": track["track_id"],
            "cid": cid,
            "type": "track",
            "is_premium": True,
            "user_id": authed_user["user_id"],
        }
    )
