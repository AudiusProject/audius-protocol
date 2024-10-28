import json
import os
import urllib.parse
from typing import Optional, TypedDict

from src.gated_content.content_access_checker import content_access_checker
from src.gated_content.signature import get_gated_content_signature
from src.models.tracks.track import Track
from src.queries.get_authed_user import get_authed_user
from src.queries.get_managed_users import is_active_manager
from src.queries.get_unpopulated_users import get_unpopulated_users
from src.utils import db_session


class GetTrackStreamSignature(TypedDict):
    track: dict
    is_preview: Optional[bool]
    user_data: Optional[str]
    user_id: Optional[int]
    user_signature: Optional[str]
    nft_access_signature: Optional[str]
    filename: Optional[str]


class GetTrackDownloadSignature(TypedDict):
    track: dict
    is_original: bool
    filename: Optional[str]
    user_data: Optional[str]
    user_id: Optional[int]
    user_signature: Optional[str]
    nft_access_signature: Optional[str]


def get_authed_or_managed_user(
    user_data: Optional[str],
    user_signature: Optional[str],
    user_id: Optional[int] = None,
):
    # Can't recover an authed_user
    if not user_data or not user_signature:
        return None

    db = db_session.get_db_read_replica()
    with db.scoped_session() as session:
        authed_user = get_authed_user(session, user_data, user_signature)

        # Failed to find user for signature
        if not authed_user:
            return None

        authed_user_id = authed_user["user_id"]

        # If no user_id is passed, authed_user matches user_id, or authed_user is not a manager of user_id
        # then we will keep authed_user as the context
        if (
            not user_id
            or authed_user["user_id"] == user_id
            or not is_active_manager(user_id, authed_user_id)
        ):
            return authed_user

        # Attempt to look up the user_id specified and return that user instead
        fetched_users = get_unpopulated_users(session, [user_id])
        if not fetched_users:
            return authed_user

        return {"user_id": user_id, "user_wallet": fetched_users[0]["wallet"]}


# Returns a dictionary {signature, cid} if user has stream access
# Returns None otherwise
def get_track_stream_signature(args: GetTrackStreamSignature):
    track = args["track"]
    is_preview = args.get("is_preview", False)
    is_stream_gated = track["stream_conditions"] is not None
    user_data = args.get("user_data")
    user_id = args.get("user_id")
    user_signature = args.get("user_signature")
    nft_access_signature = args.get("nft_access_signature")
    cid = track.get("preview_cid") if is_preview else track.get("track_cid")
    if not cid:
        return None

    cid = cid.strip()

    authed_user = get_authed_or_managed_user(user_data, user_signature, user_id)

    # all track previews and non-stream-gated tracks should be publicly available
    if is_preview or not is_stream_gated:
        signature = get_gated_content_signature(
            {
                "track_id": track["track_id"],
                "cid": cid,
                "type": "track",
                "user_id": authed_user["user_id"] if authed_user else None,
                "is_gated": False,
            }
        )
        return {"signature": signature, "cid": cid}

    if not authed_user:
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
        orig_filename = track.get("orig_filename", title)
        orig_name_without_extension = os.path.splitext(orig_filename)[0]
        filename = (
            orig_filename if is_original else f"{orig_name_without_extension}.mp3"
        )
    user_data = args.get("user_data")
    user_id = args.get("user_id")
    user_signature = args.get("user_signature")
    nft_access_signature = args.get("nft_access_signature")
    cid = track.get("orig_file_cid") if is_original else track.get("track_cid")
    if not cid:
        return None

    cid = cid.strip()
    authed_user = get_authed_or_managed_user(user_data, user_signature, user_id)

    # all non-download-gated tracks should be publicly available
    if not is_download_gated:
        signature = get_gated_content_signature(
            {
                "track_id": track["track_id"],
                "cid": cid,
                "type": "track",
                "user_id": authed_user["user_id"] if authed_user else None,
                "is_gated": False,
            }
        )
        return {"signature": signature, "cid": cid, "filename": filename}

    if not authed_user:
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
        # client must pass the correct nft access signature, i.e.
        # the one with original cid if the user wants to download the original file, or
        # the one with track cid if the user wants to download the transcoded file
        return {"signature": signature_obj, "cid": cid, "filename": filename}

    # build a track instance from the track dict
    track_entity = Track(
        track_id=track["track_id"],
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
