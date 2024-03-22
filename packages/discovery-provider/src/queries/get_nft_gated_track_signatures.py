import logging
from typing import Dict, List

from sqlalchemy.orm.session import Session

from src.models.tracks.track import Track
from src.models.users.user import User
from src.queries.get_associated_user_wallet import get_associated_user_wallet
from src.queries.get_eth_nft_gated_track_signatures import (
    get_eth_nft_gated_track_signatures,
)
from src.queries.get_sol_nft_gated_track_signatures import (
    get_sol_nft_gated_track_signatures,
)
from src.utils import db_session

logger = logging.getLogger(__name__)


def _get_user_wallet(user_id: int, session: Session):
    user_wallet = (
        session.query(User.wallet)
        .filter(
            User.user_id == user_id,
            User.is_current == True,
        )
        .one_or_none()
    )
    return user_wallet[0] if user_wallet else None


def _get_tracks(track_ids: List[int], session: Session):
    return (
        session.query(Track)
        .filter(
            Track.track_id.in_(track_ids),
            Track.is_current == True,
            Track.is_delete == False,
        )
        .all()
    )


# Returns gated tracks from given track ids with an nft collection as the gated conditions.
def _get_nft_gated_tracks(track_ids: List[int], session: Session):
    return list(
        filter(
            lambda track: track.is_stream_gated
            and track.stream_conditions != None
            and "nft_collection" in track.stream_conditions,
            _get_tracks(track_ids, session),
        )
    )


# Generates a gated content signature for each of the nft-gated tracks.
# Return a map of gated track id -> gated content signature.
def get_nft_gated_track_signatures(
    user_id: int, track_token_id_map: Dict[int, List[str]]
):
    db = db_session.get_db_read_replica()
    with db.scoped_session() as session:
        user_wallet = _get_user_wallet(user_id, session)
        associated_wallets = get_associated_user_wallet({"user_id": user_id})
        if not user_wallet:
            logger.warn(
                f"get_nft_gated_track_signatures.py | get_nft_gated_track_signatures | no wallet for user_id {user_id}"
            )
            return {}

        nft_gated_tracks = _get_nft_gated_tracks(
            list(track_token_id_map.keys()), session
        )
        eth_nft_gated_tracks = list(
            filter(
                lambda track: track.stream_conditions["nft_collection"]["chain"]
                == "eth",
                nft_gated_tracks,
            )
        )
        sol_nft_gated_tracks = list(
            filter(
                lambda track: track.stream_conditions["nft_collection"]["chain"]
                == "sol",
                nft_gated_tracks,
            )
        )
        eth_nft_gated_track_signature_maps = get_eth_nft_gated_track_signatures(
            user_wallet=user_wallet,
            eth_associated_wallets=associated_wallets["eth"],
            tracks=eth_nft_gated_tracks,
            track_token_id_map=track_token_id_map,
            user_id=user_id,
        )
        sol_nft_gated_track_signature_maps = get_sol_nft_gated_track_signatures(
            user_wallet=user_wallet,
            sol_associated_wallets=associated_wallets["sol"],
            tracks=sol_nft_gated_tracks,
            user_id=user_id,
        )

        result = {}
        for track_id, signature_map in eth_nft_gated_track_signature_maps.items():
            result[track_id] = signature_map
        for track_id, signature_map in sol_nft_gated_track_signature_maps.items():
            result[track_id] = signature_map

        return result
