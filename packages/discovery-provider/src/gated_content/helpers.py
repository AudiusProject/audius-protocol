import logging
from datetime import datetime
from typing import Dict, Union

from sqlalchemy.orm.session import Session

from src.gated_content.types import GatedContentType
from src.models.social.follow import Follow
from src.models.tracks.track import Track
from src.models.users.aggregate_user_tips import AggregateUserTip
from src.models.users.usdc_purchase import USDCPurchase
from src.utils import helpers

logger = logging.getLogger(__name__)


def does_user_have_nft_collection(
    session: Session,
    user_id: int,
    content_id: int,
    content_type: GatedContentType,
    condition_options: Union[Dict, int],
):
    # Return False here as we want to avoid this check here, in favor of
    # calling the /tracks/<user-id>/nft-gated-signatures endpoint to check
    # whether a user has access to nft-gated tracks.
    return False


def does_user_follow_artist(
    session: Session,
    user_id: int,
    content_id: int,
    content_type: GatedContentType,
    condition_options: Union[Dict, int],
):
    follow_user_id = condition_options
    result = (
        session.query(Follow)
        .filter(Follow.is_current == True)
        .filter(Follow.is_delete == False)
        .filter(Follow.follower_user_id == user_id)
        .filter(Follow.followee_user_id == follow_user_id)
        .one_or_none()
    )
    return True if result else False


def does_user_support_artist(
    session: Session,
    user_id: int,
    content_id: int,
    content_type: GatedContentType,
    condition_options: Union[Dict, int],
):
    supporting_user_id = condition_options
    result = (
        session.query(AggregateUserTip)
        .filter(AggregateUserTip.sender_user_id == user_id)
        .filter(AggregateUserTip.receiver_user_id == supporting_user_id)
        .filter(AggregateUserTip.amount >= 0)
        .first()
    )
    return True if result else False


def does_user_have_usdc_access(
    session: Session,
    user_id: int,
    content_id: int,
    content_type: GatedContentType,
    condition_options: Union[Dict, int],
):
    if content_type == "track":
        result = (
            session.query(USDCPurchase)
            .filter(
                USDCPurchase.buyer_user_id == user_id,
                USDCPurchase.content_id == content_id,
                USDCPurchase.content_type == "track",
            )
            .first()
        )
        if result:
            return True

        track_record = session.query(Track).filter(Track.track_id == content_id).first()

        # Don't check album purchase if track is download-gated only
        if not track_record or (
            track_record.is_download_gated and not track_record.is_stream_gated
        ):
            return False

        track = helpers.model_to_dictionary(track_record)
        # check if user has purchased an album currently containing the track
        if track["playlists_containing_track"]:
            album_purchase = (
                session.query(USDCPurchase)
                .filter(
                    USDCPurchase.buyer_user_id == user_id,
                    USDCPurchase.content_id.in_(track["playlists_containing_track"]),
                    USDCPurchase.content_type == "album",
                )
                .first()
            )
            if bool(album_purchase):
                return True

        # check if user has purchased an album previously containing the track
        # and the purchase was made before the track was removed from the album
        if track["playlists_previously_containing_track"]:
            playlist_ids_previously_containing_track = list(
                map(int, track["playlists_previously_containing_track"].keys())
            )
            album_purchases = (
                session.query(USDCPurchase)
                .filter(
                    USDCPurchase.buyer_user_id == user_id,
                    USDCPurchase.content_id.in_(
                        playlist_ids_previously_containing_track
                    ),
                    USDCPurchase.content_type == "album",
                )
                .all()
            )
            for album_purchase in album_purchases:
                if (
                    album_purchase.content_id
                    in playlist_ids_previously_containing_track
                    and album_purchase.created_at
                    <= datetime.utcfromtimestamp(
                        track["playlists_previously_containing_track"]
                        .get(str(album_purchase.content_id))
                        .get("time")
                    )
                ):
                    return True
        return False
    else:
        result = (
            session.query(USDCPurchase)
            .filter(
                USDCPurchase.buyer_user_id == user_id,
                USDCPurchase.content_id == content_id,
                USDCPurchase.content_type == content_type,
            )
            .first()
        )
        return bool(result)
