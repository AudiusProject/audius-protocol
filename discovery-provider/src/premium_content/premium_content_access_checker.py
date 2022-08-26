import json
import logging
from typing import Dict, Optional, Tuple, TypedDict, cast

from src.models.tracks.track import Track
from src.premium_content.helpers import does_user_have_nft_collection
from src.premium_content.types import PremiumContentType
from src.utils import db_session

logger = logging.getLogger(__name__)


class PremiumContentAccessResponse(TypedDict):
    is_premium: bool
    does_user_have_access: bool


class PremiumContentAccessChecker:
    # check if content is premium
    # - if not, then user has access
    # - if so, check whether user fulfills the conditions
    #
    # Returns a dictionary: { track is premium, user has access }
    #
    # Note: premium content id for type should exist, but just in case it does not,
    # we return true for user access so that (non-existent) track does not change
    # existing flow of the function caller.
    def check_access(
        self,
        user_id: int,
        premium_content_id: int,
        premium_content_type: PremiumContentType,
    ) -> PremiumContentAccessResponse:
        premium_content_data = self._get_premium_content_data(premium_content_id)
        is_premium = premium_content_data["is_premium"]
        premium_conditions = premium_content_data["premium_conditions"]
        content_owner_id = premium_content_data["content_owner_id"]

        if not is_premium:
            # premium_conditions should always be null here as it makes
            # no sense to have a non-premium track with conditions
            if premium_conditions:
                logger.warn(
                    f"premium_content_access_checker.py | _aggregate_conditions | non-premium content with id {premium_content_id} and type {premium_content_type} has premium conditions."
                )
            return {"is_premium": False, "does_user_have_access": True}

        # premium_conditions should always be true here because we know
        # that is_premium is true if we get here and it makes no sense
        # to have a premium track with no conditions
        if not premium_conditions:
            logger.warn(
                f"premium_content_access_checker.py | _aggregate_conditions | premium content with id {premium_content_id} and type {premium_content_type} has no premium conditions."
            )
            return {"is_premium": is_premium, "does_user_have_access": True}

        does_user_have_access = self._evaluate_conditions(
            user_id=user_id,
            premium_content_owner_id=cast(int, content_owner_id),
            premium_conditions=premium_conditions,
        )
        return {"is_premium": True, "does_user_have_access": does_user_have_access}

    # Returns a dictionary { content is premium, premium content conditions, content owner id }
    def _get_premium_content_data(
        self, premium_content_id: int, premium_content_type: PremiumContentType
    ):
        # for now, we only allow tracks to be premium; premium playlists will come later
        if premium_content_type != "track":
            return {
                "is_premium": False,
                "premium_conditions": None,
                "owner_id": None,
            }

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

            return {
                "is_premium": track.is_premium,
                "premium_conditions": track.premium_conditions,
                "owner_id": track.owner_id,
            }

    # There will eventually be another step prior to this one where
    # we aggregate multiple conditions and evaluate them altogether.
    # For now, we only support one condition, which is the ownership
    # of an NFT from a given collection.
    def _evaluate_conditions(
        self, user_id: int, premium_content_owner_id: int, premium_conditions: Dict
    ):
        if len(premium_conditions) != 1:
            logging.info(
                f"premium_content_access_checker.py | _aggregate_conditions | invalid conditions: {json.dumps(premium_conditions)}"
            )
            return False

        condition, value = list(premium_conditions.items())[0]
        if condition != "nft-collection":
            return False

        return does_user_have_nft_collection(user_id, value)


premium_content_access_checker = PremiumContentAccessChecker()
