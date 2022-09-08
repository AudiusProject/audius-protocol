import json
import logging
from typing import Dict, List, TypedDict, cast

from sqlalchemy.orm.session import Session
from src.models.tracks.track import Track
from src.premium_content.helpers import does_user_have_nft_collection
from src.premium_content.premium_content_types import PremiumContentType
from src.utils import helpers

logger = logging.getLogger(__name__)


class PremiumContentAccessBatchArgs(TypedDict):
    user_id: int
    premium_content_id: int
    premium_content_type: PremiumContentType


class PremiumContentAccess(TypedDict):
    is_premium: bool
    does_user_have_access: bool


PremiumTrackAccessResult = Dict[int, Dict[int, PremiumContentAccess]]


class PremiumContentAccessBatchResponse(TypedDict):
    # track : user id -> track id -> access
    track: PremiumTrackAccessResult


class PremiumContentAccessChecker:
    # Given a user id, premium content id, and premium content type, and premium content entity,
    # this method checks for access to the premium contents by the users.
    #
    # Returns:
    # {
    #   "is_premium": bool,
    #   "does_user_have_access": bool
    # }
    def check_access(
        self,
        user_id: int,
        premium_content_id: int,
        premium_content_type: PremiumContentType,
        premium_content_entity: Track,
    ) -> PremiumContentAccess:
        if premium_content_type != "track":
            logger.warn(
                f"premium_content_access_checker | check_access | premium content type {premium_content_type} is not supported."
            )
            return {"is_premium": False, "does_user_have_access": True}

        is_premium = premium_content_entity.is_premium
        premium_conditions = premium_content_entity.premium_conditions
        content_owner_id = premium_content_entity.owner_id

        if not is_premium:
            # premium_conditions should always be null here as it makes
            # no sense to have a non-premium track with conditions
            if premium_conditions:
                logger.warn(
                    f"premium_content_access_checker.py | check_access | non-premium content with id {premium_content_id} and type {premium_content_type} has premium conditions."
                )
            return {"is_premium": False, "does_user_have_access": True}

        # premium_conditions should always be true here because we know
        # that is_premium is true if we get here and it makes no sense
        # to have a premium track with no conditions
        if not premium_conditions:
            logger.warn(
                f"premium_content_access_checker.py | check_access | premium content with id {premium_content_id} and type {premium_content_type} has no premium conditions."
            )
            return {
                "is_premium": True,
                "does_user_have_access": True,
            }

        # track owner has access to own premium track
        if content_owner_id == user_id:
            return {
                "is_premium": True,
                "does_user_have_access": True,
            }

        return {
            "is_premium": True,
            "does_user_have_access": self._evaluate_conditions(
                user_id=user_id,
                premium_content_owner_id=cast(int, content_owner_id),
                premium_conditions=cast(dict, premium_conditions),
            ),
        }

    # Given a list of objects, each with a user id, premium content id, and premium content type,
    # this method checks for access to the premium contents by the users.
    #
    # Returns a dictionary in the following format:
    # {
    #   <premium-content-type>: {
    #     <user-id>: {
    #       <track-id>: {
    #         "is_premium": bool,
    #         "does_user_have_access": bool
    #       }
    #     }
    #   }
    # }
    def check_access_for_batch(
        self, session: Session, args: List[PremiumContentAccessBatchArgs]
    ) -> PremiumContentAccessBatchResponse:
        # for now, we only allow tracks to be premium; premium playlists will come later
        valid_args = list(
            filter(lambda arg: arg["premium_content_type"] == "track", args)
        )

        if not valid_args:
            return {"track": {}}

        track_access_users = {
            arg["premium_content_id"]: arg["user_id"] for arg in valid_args
        }

        premium_track_data = self._get_premium_track_data_for_batch(
            session, list(track_access_users.keys())
        )

        track_access_result: PremiumTrackAccessResult = {}

        for track_id, data in premium_track_data.items():
            user_id = track_access_users[track_id]
            if user_id not in track_access_result:
                track_access_result[user_id] = {}

            is_premium = data["is_premium"]
            premium_conditions = data["premium_conditions"]
            content_owner_id = data["content_owner_id"]

            if not is_premium:
                # premium_conditions should always be null here as it makes
                # no sense to have a non-premium track with conditions
                if premium_conditions:
                    logger.warn(
                        f"premium_content_access_checker.py | check_access_for_batch | non-premium content with id {track_id} and type 'track' has premium conditions."
                    )
                track_access_result[user_id][track_id] = {
                    "is_premium": False,
                    "does_user_have_access": True,
                }

            # premium_conditions should always be true here because we know
            # that is_premium is true if we get here and it makes no sense
            # to have a premium track with no conditions
            elif not premium_conditions:
                logger.warn(
                    f"premium_content_access_checker.py | check_access_for_batch | premium content with id {track_id} and type 'track' has no premium conditions."
                )
                track_access_result[user_id][track_id] = {
                    "is_premium": True,
                    "does_user_have_access": True,
                }

            # track owner has access to own premium track
            elif content_owner_id == user_id:
                track_access_result[user_id][track_id] = {
                    "is_premium": True,
                    "does_user_have_access": True,
                }

            else:
                track_access_result[user_id][track_id] = {
                    "is_premium": True,
                    "does_user_have_access": self._evaluate_conditions(
                        user_id=user_id,
                        premium_content_owner_id=cast(int, content_owner_id),
                        premium_conditions=premium_conditions,
                    ),
                }

        return {"track": track_access_result}

    def _get_premium_track_data_for_batch(self, session: Session, track_ids: List[int]):
        tracks = (
            session.query(Track)
            .filter(
                Track.track_id.in_(track_ids),
                Track.is_current == True,
                Track.is_delete == False,
            )
            .all()
        )
        tracks = list(map(helpers.model_to_dictionary, tracks))

        return {
            track["track_id"]: {  # type: ignore
                "is_premium": track["is_premium"],  # type: ignore
                "premium_conditions": track["premium_conditions"],  # type: ignore
                "content_owner_id": track["owner_id"],  # type: ignore
            }
            for track in tracks
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
                f"premium_content_access_checker.py | _evaluate_conditions | invalid conditions: {json.dumps(premium_conditions)}"
            )
            return False

        condition, value = list(premium_conditions.items())[0]
        if condition != "nft-collection":
            return False

        return does_user_have_nft_collection(user_id, value)


premium_content_access_checker = PremiumContentAccessChecker()
