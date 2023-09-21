import json
import urllib.parse
from typing import Dict, Optional, TypedDict

from src.models.tracks.track import Track
from src.premium_content.premium_content_access_checker import (
    premium_content_access_checker,
)
from src.premium_content.signature import get_premium_content_signature
from src.queries.get_authed_user import get_authed_user
from src.utils import db_session


class GetTrackStreamSignature(TypedDict):
    track: Track
    stream_preview: Optional[bool]
    user_data: Optional[str]
    user_signature: Optional[str]
    premium_content_signature: Optional[str]


def get_track_stream_signature(args: Dict):
    track = args["track"]
    stream_preview = args.get("stream_preview", False)

    authed_user_id = None

    user_data = args["user_data"]
    user_signature = args["user_signature"]

    if user_data and user_signature:
        authed_user = get_authed_user(user_data, user_signature)
        authed_user_id = authed_user.get("user_id") if authed_user else None

    # non-premium tracks and all track previews should be publicly available
    if not track["is_premium"] or stream_preview:
        return get_premium_content_signature(
            {
                "track_id": track["track_id"],
                "cid": track["preview_cid"] if stream_preview else track["track_cid"],
                "type": "track",
                "user_id": authed_user_id,
                "is_premium": False,
            }
        )

    if not authed_user_id:
        return None

    premium_content_signature = args["premium_content_signature"]
    if premium_content_signature:
        # check that authed user is the same as user for whom the premium content signature was signed
        premium_content_signature_obj = json.loads(
            urllib.parse.unquote(premium_content_signature)
        )
        signature_data = json.loads(premium_content_signature_obj["data"])

        if (
            signature_data.get("user_wallet", False)
            != authed_user["user_wallet"].lower()
            or signature_data.get("cid", False) != track["track_cid"]
            or signature_data.get("shouldCache", False)
        ):
            return None
    else:
        # build a track instance from the track dict
        track_entity = Track(
            track_id=track["track_id"],
            is_premium=track["is_premium"],
            premium_conditions=track["premium_conditions"],
            owner_id=track["owner_id"],
        )
        db = db_session.get_db_read_replica()
        with db.scoped_session() as session:
            access = premium_content_access_checker.check_access(
                session=session,
                user_id=authed_user["user_id"],
                premium_content_id=track_entity.track_id,
                premium_content_type="track",
                premium_content_entity=track_entity,
            )
            if not access["does_user_have_access"]:
                return None

    return get_premium_content_signature(
        {
            "track_id": track["track_id"],
            "cid": track["track_cid"],
            "type": "track",
            "is_premium": True,
            "user_id": authed_user["user_id"],
        }
    )
