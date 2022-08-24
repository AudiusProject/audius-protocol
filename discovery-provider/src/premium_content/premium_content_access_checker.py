import json
import logging
from typing import Dict, Optional, Tuple

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
    #
    # Returns a tuple of (bool, bool) -> (track is premium, user has access)
    #
    # Note: premium content id for type should exist, but just in case it does not,
    # we return true for user access so that (non-existent) track does not change
    # existing flow of the function caller.
    def check_access(
        self,
        user_id: int,
        premium_content_id: int,
        premium_content_type: PremiumContentType,
    ) -> Tuple[bool, bool]:
        # for now, we only allow tracks to be premium
        # premium playlists will come later
        if premium_content_type != "track":
            return False, True

        (
            is_premium,
            premium_conditions,
            content_owner_id,
        ) = self._is_content_premium(premium_content_id)

        if not is_premium:
            # premium_conditions should always be null here as it makes
            # no sense to have a non-premium track with conditions
            if premium_conditions:
                logger.warn(
                    f"premium_content_access_checker.py | _aggregate_conditions | non-premium content with id {premium_content_id} and type {premium_content_type} has premium conditions."
                )
            return False, True

        if not premium_conditions:
            # is_premium should always be false here as it makes
            # no sense to have a premium track with no conditions
            if is_premium:
                logger.warn(
                    f"premium_content_access_checker.py | _aggregate_conditions | premium content with id {premium_content_id} and type {premium_content_type} has no premium conditions."
                )
            return is_premium, True

        does_user_have_access = self._evaluate_conditions(
            user_id, content_owner_id, premium_conditions
        )
        return True, does_user_have_access

    # Returns a tuple of (bool, Dict | None, int | None) -> (track is premium, track premium conditions, track owner id)
    def _is_content_premium(
        self, premium_content_id: int
    ) -> Tuple[bool, Optional[Dict], Optional[int]]:
        db = db_session.get_db_read_replica()
        with db.scoped_session() as session:
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
            return False

        condition, value = list(premium_conditions.items())[0]
        if condition != PREMIUM_CONTENT_CONDITIONS.NFT_COLLECTION.value:
            return False

        return does_user_have_nft_collection(user_id, value)


premium_content_access_checker = PremiumContentAccessChecker()
