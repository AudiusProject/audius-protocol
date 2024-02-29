import logging
from typing import Dict, Union

from sqlalchemy.orm.session import Session

from src.gated_content.types import GatedContentType
from src.models.social.follow import Follow
from src.models.tracks.track import Track
from src.models.users.aggregate_user_tips import AggregateUserTip
from src.models.users.usdc_purchase import USDCPurchase

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


def has_user_purchased_track(
    session: Session,
    user_id: int,
    content_id: int,
    content_type: GatedContentType,
    condition_options: Union[Dict, int],
):
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

    track = session.query(Track).filter(Track.track_id == content_id).first()

    # Don't check album purchase if track is download-gated only
    if track and track.is_download_gated and not track.is_stream_gated:
        return False

    album_purchase = (
        session.query(USDCPurchase)
        .filter(
            USDCPurchase.buyer_user_id == user_id,
            USDCPurchase.content_id.in_(track.playlists_containing_track),
            USDCPurchase.content_type == "album",
        )
        .first()
    )
    if album_purchase:
        return True

    return False
