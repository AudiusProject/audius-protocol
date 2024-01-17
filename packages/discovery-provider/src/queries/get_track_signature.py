import json
import urllib.parse
from typing import Optional, TypedDict

from src.gated_content.content_access_checker import content_access_checker
from src.gated_content.signature import get_gated_content_signature
from src.models.tracks.track import Track
from src.queries.get_authed_user import get_authed_user
from src.utils import db_session


class GetTrackStreamSignature(TypedDict):
    track: dict
    is_preview: Optional[bool]
    user_data: Optional[str]
    user_signature: Optional[str]
    nft_access_signature: Optional[str]
    filename: Optional[str]


class GetTrackDownloadSignature(TypedDict):
    track: dict
    is_original: bool
    filename: Optional[str]
    user_data: Optional[str]
    user_signature: Optional[str]
    nft_access_signature: Optional[str]


# Returns a dictionary {signature, cid} if user has stream access
# Returns None otherwise
def get_track_stream_signature(args: GetTrackStreamSignature):
    track = args["track"]
    is_stream_gated = track["is_stream_gated"]
    is_preview = args.get("is_preview", False)
    user_data = args["user_data"]
    user_signature = args["user_signature"]
    nft_access_signature = args["nft_access_signature"]
    cid = track.get("preview_cid") if is_preview else track.get("track_cid")
    if not cid:
        return None

    cid = cid.strip()
    authed_user_id = None
    if user_data and user_signature:
        authed_user = get_authed_user(user_data, user_signature)
        authed_user_id = authed_user.get("user_id") if authed_user else None

    # all track previews and non-stream-gated tracks should be publicly available
    if is_preview or not is_stream_gated:
        signature = get_gated_content_signature(
            {
                "track_id": track["track_id"],
                "cid": cid,
                "type": "track",
                "user_id": authed_user_id,
                "is_gated": False,
            }
        )
        return {"signature": signature, "cid": cid}

    if not authed_user_id:
        return None

    if nft_access_signature:
        # check that authed user is the same as user for whom the gated content signature was signed
        # there is no need to perform other checks as CN would take care of them
        signature_obj = json.loads(urllib.parse.unquote(nft_access_signature))
        signature_data = json.loads(signature_obj["data"])
        signature_user_wallet = signature_data.get("user_wallet", None)
        authed_user_wallet = authed_user["user_wallet"].lower()
        if signature_user_wallet != authed_user_wallet:
            return None
        return {"signature": signature_obj, "cid": cid}

    # build a track instance from the track dict
    track_entity = Track(
        track_id=track["track_id"],
        is_stream_gated=is_stream_gated,
        stream_conditions=track["stream_conditions"],
        owner_id=track["owner_id"],
    )

    # check if user has access to stream the track
    db = db_session.get_db_read_replica()
    with db.scoped_session() as session:
        access = content_access_checker.check_access(
            session=session,
            user_id=authed_user["user_id"],
            content_type="track",
            content_entity=track_entity,
        )
        if not access["has_stream_access"]:
            return None

    signature = get_gated_content_signature(
        {
            "track_id": track["track_id"],
            "cid": cid,
            "type": "track",
            "is_gated": True,
            "user_id": authed_user["user_id"],
        }
    )
    return {"signature": signature, "cid": cid}


# Returns a dictionary {signature, cid, filename} if user has download access
# Returns None otherwise
def get_track_download_signature(args: GetTrackDownloadSignature):
    track = args["track"]
    is_download_gated = track["is_download_gated"]
    title = track["title"]
    is_original = args.get("is_original", False)
    filename = args.get("filename")
    if not filename:
        filename = track.get("orig_filename", title) if is_original else f"{title}.mp3"
    user_data = args["user_data"]
    user_signature = args["user_signature"]
    nft_access_signature = args["nft_access_signature"]
    is_downloadable = track.get("is_downloadable") or track.get("download", {}).get(
        "is_downloadable"
    )
    cid = track.get("orig_file_cid") if is_original else track.get("track_cid")
    if not cid or not is_downloadable:
        return None

    cid = cid.strip()
    authed_user_id = None

    if user_data and user_signature:
        authed_user = get_authed_user(user_data, user_signature)
        authed_user_id = authed_user.get("user_id") if authed_user else None

    # all downloadable and non-download-gated tracks should be publicly available
    if not is_download_gated:
        signature = get_gated_content_signature(
            {
                "track_id": track["track_id"],
                "cid": cid,
                "type": "track",
                "user_id": authed_user_id,
                "is_gated": False,
            }
        )
        return {"signature": signature, "cid": cid, "filename": filename}

    if not authed_user_id:
        return None

    if nft_access_signature:
        # check that authed user is the same as user for whom the gated content signature was signed
        # there is no need to perform other checks as CN would take care of them
        signature_obj = json.loads(urllib.parse.unquote(nft_access_signature))
        signature_data = json.loads(signature_obj["data"])
        signature_user_wallet = signature_data.get("user_wallet", None)
        authed_user_wallet = authed_user["user_wallet"].lower()
        if signature_user_wallet != authed_user_wallet:
            return None
        return {"signature": signature_obj, "cid": cid, "filename": filename}

    # build a track instance from the track dict
    track_entity = Track(
        track_id=track["track_id"],
        is_download_gated=is_download_gated,
        download_conditions=track["download_conditions"],
        owner_id=track["owner_id"],
    )

    # check if user has access to stream the track
    db = db_session.get_db_read_replica()
    with db.scoped_session() as session:
        access = content_access_checker.check_access(
            session=session,
            user_id=authed_user["user_id"],
            content_type="track",
            content_entity=track_entity,
        )
        if not access["has_download_access"]:
            return None

    signature = get_gated_content_signature(
        {
            "track_id": track["track_id"],
            "cid": cid,
            "type": "track",
            "is_gated": True,
            "user_id": authed_user["user_id"],
        }
    )
    return {"signature": signature, "cid": cid, "filename": filename}
