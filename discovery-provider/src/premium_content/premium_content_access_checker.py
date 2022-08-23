import json
import logging
from typing import Dict

from src.models.tracks.track import Track
from src.premium_content.helpers import does_user_have_nft_collection
from src.premium_content.types import PREMIUM_CONTENT_CONDITIONS, PremiumContentType
from src.utils import db_session

logger = logging.getLogger(__name__)


class PremiumContentAccessChecker:
    def __init__(self):
        pass

    # check if content is premium
    # - if not, then user has access
    # - if so, check whether user fulfills the conditions
    def check_access(
        self,
        user_id: int,
        premium_content_id: int,
        premium_content_type: PremiumContentType,
    ):
        is_premium, premium_conditions, content_owner_id = self._is_content_premium(
            premium_content_id, premium_content_type
        )

        if not is_premium:
            return True

        self._evaluate_conditions(user_id, content_owner_id, premium_conditions)

    def _is_content_premium(
        self, premium_content_id: int, premium_content_type: PremiumContentType
    ):
        db = db_session.get_db_read_replica()
        with db.scoped_session() as session:
            # for now, we only allow tracks to be premium
            # premium playlists will come later
            if premium_content_type != "track":
                return False, None, None

            track = (
                session.query(Track)
                .filter(
                    Track.track_id == premium_content_id,
                    Track.is_current == True,
                    Track.is_delete == False,
                )
                .first()
            )

            if not track:
                return False, None, None
            return track.is_premium, track.premium_conditions, track.owner_id

    # There will eventually be another step prior to this one where
    # we aggregate multiple conditions and evaluate them altogether.
    # For now, we only support one condition, which is the ownership
    # of an NFT from a given collection.
    def _evaluate_conditions(
        self, user_id: int, track_owner_id: int, premium_conditions: Dict
    ):
        if len(premium_conditions) != 1:
            logging.info(
                f"premium_content_access_checker.py | _aggregate_conditions | invalid conditions: {json.dumps(premium_conditions)}"
            )
            return None

        condition, value = list(premium_conditions.items())[0]
        if condition != PREMIUM_CONTENT_CONDITIONS.NFT_COLLECTION:
            return False

        return does_user_have_nft_collection(user_id, value)


premium_content_access_checker = PremiumContentAccessChecker()
