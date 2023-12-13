import json
import logging
from typing import Dict, List, Optional, TypedDict, Union, cast

from sqlalchemy.orm.session import Session
from typing_extensions import Protocol

from src.gated_content.gated_content_types import (
    GatedContentConditions,
    GatedContentType,
)
from src.gated_content.helpers import (
    does_user_follow_artist,
    does_user_have_nft_collection,
    does_user_support_artist,
    has_user_purchased_content,
)
from src.models.tracks.track import Track
from src.utils import helpers

logger = logging.getLogger(__name__)


class GatedContentAccessBatchArgs(TypedDict):
    user_id: int
    premium_content_id: int
    premium_content_type: GatedContentType


class GatedContentAccess(TypedDict):
    is_gated: bool
    does_user_have_access: bool


GatedTrackAccessResult = Dict[int, Dict[int, GatedContentAccess]]


class GatedContentAccessBatchResponse(TypedDict):
    # track : user id -> track id -> access
    track: GatedTrackAccessResult


class GatedContentAccessHandler(Protocol):
    def __call__(
        self,
        session: Session,
        user_id: int,
        content_id: int,
        content_type: GatedContentType,
        condition_options: Union[Dict, int],
    ) -> bool:
        pass


handler: GatedContentAccessHandler = has_user_purchased_content


GATED_CONDITION_TO_HANDLER_MAP: Dict[
    GatedContentConditions, GatedContentAccessHandler
] = {
    "nft_collection": does_user_have_nft_collection,
    "follow_user_id": does_user_follow_artist,
    "tip_user_id": does_user_support_artist,
    "usdc_purchase": has_user_purchased_content,
}


class GatedContentAccessChecker:
    # Given a user id, gated content id, and gated content type, and gated content entity,
    # this method checks for access to the gated contents by the users.
    #
    # Returns:
    # {
    #   "is_gated": bool,
    #   "does_user_have_access": bool
    # }
    def check_access(
        self,
        session: Session,
        user_id: int,
        premium_content_id: int,
        premium_content_type: GatedContentType,
        premium_content_entity: Track,
        is_download: Optional[bool] = False,
    ) -> GatedContentAccess:
        if premium_content_type != "track":
            logger.warn(
                f"gated_content_access_checker | check_access | gated content type {premium_content_type} is not supported."
            )
            return {"is_gated": False, "does_user_have_access": True}

        is_gated = False
        conditions = None
        content_owner_id = premium_content_entity.owner_id

        if is_download:
            is_gated = premium_content_entity.is_download_gated
            conditions = premium_content_entity.download_conditions
        else:
            is_gated = premium_content_entity.is_stream_gated
            conditions = premium_content_entity.stream_conditions

        if not is_gated:
            # conditions should always be null here as it makes
            # no sense to have a non-gated track with gating conditions
            if conditions:
                logger.warn(
                    f"gated_content_access_checker.py | check_access | non-gated content with id {premium_content_id} and type {premium_content_type} has gated conditions."
                )
            return {"is_gated": False, "does_user_have_access": True}

        # conditions should always be true here because we know
        # that content is gated if we get here and it makes no sense
        # to have a gated track with no conditions
        if conditions is None:
            logger.warn(
                f"gated_content_access_checker.py | check_access | gated content with id {premium_content_id} and type {premium_content_type} has no gated conditions."
            )
            return {
                "is_gated": True,
                "does_user_have_access": True,
            }

        # track owner has access to their own gated track
        if content_owner_id == user_id:
            return {
                "is_gated": True,
                "does_user_have_access": True,
            }

        return {
            "is_gated": True,
            "does_user_have_access": self._evaluate_conditions(
                session=session,
                user_id=user_id,
                content_id=premium_content_entity.track_id,
                content_type="track",
                conditions=cast(dict, conditions),
            ),
        }

    # Given a list of objects, each with a user id, gated content id, and gated content type,
    # this method checks for access to the gated contents by the users.
    #
    # Returns a dictionary in the following format:
    # {
    #   <gated-content-type>: {
    #     <user-id>: {
    #       <track-id>: {
    #         "is_gated": bool,
    #         "does_user_have_access": bool
    #       }
    #     }
    #   }
    # }
    def check_access_for_batch(
        self, session: Session, args: List[GatedContentAccessBatchArgs], is_download: Optional[bool] = False
    ) -> GatedContentAccessBatchResponse:
        # for now, we only allow tracks to be gated; gated playlists will come later
        valid_args = list(
            filter(lambda arg: arg["premium_content_type"] == "track", args)
        )

        if not valid_args:
            return {"track": {}}

        track_access_users = {
            arg["premium_content_id"]: arg["user_id"] for arg in valid_args
        }

        gated_track_data = self._get_gated_track_data_for_batch(
            session, list(track_access_users.keys())
        )

        track_access_result: GatedTrackAccessResult = {}

        for track_id, data in gated_track_data.items():
            user_id = track_access_users[track_id]
            if user_id not in track_access_result:
                track_access_result[user_id] = {}

            is_gated = False
            conditions = None
            content_owner_id = data["content_owner_id"]

            if is_download:
                is_gated = data["is_download_gated"]
                conditions = data["download_conditions"]
            else:
                is_gated = data["is_stream_gated"]
                conditions = data["stream_conditions"]

            if not is_gated:
                # conditions should always be null here as it makes
                # no sense to have a non-gated track with conditions
                if conditions:
                    logger.warn(
                        f"gated_content_access_checker.py | check_access_for_batch | non-gated content with id {track_id} and type 'track' has gated conditions."
                    )
                track_access_result[user_id][track_id] = {
                    "is_gated": False,
                    "does_user_have_access": True,
                }

            # conditions should always be true here because we know
            # that content is gated if we get here and it makes no sense
            # to have a gated track with no conditions
            elif conditions is None:
                logger.warn(
                    f"gated_content_access_checker.py | check_access_for_batch | gated content with id {track_id} and type 'track' has no gated conditions."
                )
                track_access_result[user_id][track_id] = {
                    "is_gated": True,
                    "does_user_have_access": True,
                }

            # track owner has access to their own gated track
            elif content_owner_id == user_id:
                track_access_result[user_id][track_id] = {
                    "is_gated": True,
                    "does_user_have_access": True,
                }

            else:
                track_access_result[user_id][track_id] = {
                    "is_gated": True,
                    "does_user_have_access": self._evaluate_conditions(
                        session=session,
                        user_id=user_id,
                        content_id=track_id,
                        content_type="track",
                        conditions=conditions,
                    ),
                }

        return {"track": track_access_result}

    def _get_gated_track_data_for_batch(self, session: Session, track_ids: List[int]):
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
                "is_stream_gated": track["is_stream_gated"],  # type: ignore
                "stream_conditions": track["stream_conditions"],  # type: ignore
                "is_download_gated": track["is_download_gated"],  # type: ignore
                "download_conditions": track["download_conditions"],  # type: ignore
                "content_owner_id": track["owner_id"],  # type: ignore
            }
            for track in tracks
        }

    # There will eventually be another step prior to this one where
    # we aggregate multiple conditions and evaluate them altogether.
    # For now, we do not support aggregate conditions.
    def _evaluate_conditions(
        self,
        session: Session,
        user_id: int,
        content_id: int,
        content_type: GatedContentType,
        conditions: Dict,
    ):
        if len(conditions) != 1:
            logging.info(
                f"gated_content_access_checker.py | _evaluate_conditions | invalid number of conditions: {json.dumps(conditions)}"
            )
            return False

        # Indexing of the gated content should have already validated
        # the gated conditions, but we perform additional checks here just in case.
        condition, condition_options = list(conditions.items())[0]
        if condition not in set(GATED_CONDITION_TO_HANDLER_MAP.keys()):
            logging.info(
                f"gated_content_access_checker.py | _evaluate_conditions | invalid condition: {json.dumps(conditions)}"
            )
            return False

        return GATED_CONDITION_TO_HANDLER_MAP[condition](
            session=session,
            user_id=user_id,
            content_id=content_id,
            content_type=content_type,
            condition_options=condition_options,
        )


gated_content_access_checker = GatedContentAccessChecker()
