import json
import logging
from typing import Dict, List, Optional, TypedDict, Union, cast

from sqlalchemy.orm.session import Session
from typing_extensions import Protocol

from src.gated_content.helpers import (
    does_user_follow_artist,
    does_user_have_nft_collection,
    does_user_support_artist,
    has_user_purchased_content,
)
from src.gated_content.types import GatedContentConditions, GatedContentType
from src.models.tracks.track import Track
from src.utils import helpers

logger = logging.getLogger(__name__)


class ContentAccessBatchArgs(TypedDict):
    user_id: int
    content_id: int
    content_type: GatedContentType


class ContentAccessResponse(TypedDict):
    is_gated: bool
    does_user_have_access: bool


GatedTrackAccessResult = Dict[int, Dict[int, ContentAccessResponse]]


class ContentAccessBatchResponse(TypedDict):
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


GATED_CONDITION_TO_HANDLER_MAP: Dict[
    GatedContentConditions, GatedContentAccessHandler
] = {
    "nft_collection": does_user_have_nft_collection,
    "follow_user_id": does_user_follow_artist,
    "tip_user_id": does_user_support_artist,
    "usdc_purchase": has_user_purchased_content,
}


class ContentAccessChecker:
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
        content_id: int,
        content_type: GatedContentType,
        content_entity: Track,
        is_download: Optional[bool] = False,
    ) -> ContentAccessResponse:
        if content_type != "track":
            logger.warn(
                f"gated_content_access_checker | check_access | gated content type {content_type} is not supported."
            )
            return {"is_gated": False, "does_user_have_access": True}

        is_gated = False
        conditions = None
        content_owner_id = content_entity.owner_id

        if is_download:
            is_gated = content_entity.is_download_gated
            conditions = content_entity.download_conditions
        else:
            is_gated = content_entity.is_stream_gated
            conditions = content_entity.stream_conditions

        if not is_gated:
            # conditions should always be null here as it makes
            # no sense to have a non-gated track with gating conditions
            if conditions:
                logger.warn(
                    f"gated_content_access_checker.py | check_access | non-gated content with id {content_id} and type {content_type} has gated conditions."
                )
            return {"is_gated": False, "does_user_have_access": True}

        # conditions should always be true here because we know
        # that content is gated if we get here and it makes no sense
        # to have a gated track with no conditions
        if conditions is None:
            logger.warn(
                f"gated_content_access_checker.py | check_access | gated content with id {content_id} and type {content_type} has no gated conditions."
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
                content_id=content_entity.track_id,
                content_type="track",
                content_entity=helpers.model_to_dictionary(content_entity),
                conditions=cast(dict, conditions),
                is_download=bool(is_download),
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
        self,
        session: Session,
        args: List[ContentAccessBatchArgs],
        is_download: Optional[bool] = False,
    ) -> ContentAccessBatchResponse:
        # for now, we only allow tracks to be gated; gated playlists will come later
        valid_args = list(filter(lambda arg: arg["content_type"] == "track", args))

        if not valid_args:
            return {"track": {}}

        track_access_users = {arg["content_id"]: arg["user_id"] for arg in valid_args}

        gated_track_data = self._get_gated_track_data_for_batch(
            session, list(track_access_users.keys())
        )

        track_access_result: GatedTrackAccessResult = {}

        for track_id, track_entity in gated_track_data.items():
            user_id = track_access_users[track_id]
            if user_id not in track_access_result:
                track_access_result[user_id] = {}

            is_gated = False
            conditions = None
            content_owner_id = track_entity["content_owner_id"]

            if is_download:
                is_gated = track_entity["is_download_gated"]
                conditions = track_entity["download_conditions"]
            else:
                is_gated = track_entity["is_stream_gated"]
                conditions = track_entity["stream_conditions"]

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
                        content_entity=track_entity,
                        conditions=conditions,
                        is_download=bool(is_download),
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
            track["track_id"]: {
                "is_stream_gated": track["is_stream_gated"],
                "stream_conditions": track["stream_conditions"],
                "is_download_gated": track["is_download_gated"],
                "download_conditions": track["download_conditions"],
                "content_owner_id": track["owner_id"],
            }
            for track in tracks
        }

    def _evaluate_conditions(
        self,
        session: Session,
        user_id: int,
        content_id: int,
        content_type: GatedContentType,
        content_entity: dict,
        conditions: Dict,
        is_download: bool,
    ):
        valid_conditions = set(GATED_CONDITION_TO_HANDLER_MAP.keys())
        for condition, condition_options in conditions.items():
            if condition not in valid_conditions:
                logging.info(
                    f"gated_content_access_checker.py | _evaluate_conditions | invalid condition: {json.dumps(conditions)}"
                )
                return False

            # check track access for condition
            handler = GATED_CONDITION_TO_HANDLER_MAP[condition]
            has_access = handler(
                session=session,
                user_id=user_id,
                content_id=content_id,
                content_type=content_type,
                condition_options=condition_options,
            )
            if not has_access:
                return False

        # if stem track, check parent track access
        return self._check_stem_access(
            session=session,
            user_id=user_id,
            content_entity=content_entity,
            is_download=is_download,
        )

    def _check_stem_access(
        self,
        session: Session,
        user_id: int,
        content_entity: dict,
        is_download: bool,
    ):
        stem_of = content_entity.get("stem_of", None)
        if not stem_of:
            return True

        track_id = content_entity["track_id"]
        parent_id = stem_of.get("parent_track_id")
        if not parent_id:
            logging.warn(
                f"gated_content_access_checker.py | _check_stem_access | stem track {track_id} has no parent track id."
            )
            return True

        parent_track = (
            session.query(Track)
            .filter(
                Track.track_id == parent_id,
                Track.is_current == True,
                Track.is_delete == False,
            )
            .first()
        )
        if not parent_track:
            logging.warn(
                f"gated_content_access_checker.py | _check_stem_access | stem track {track_id} has no parent track."
            )
            return True

        parent_access = self.check_access(
            session=session,
            user_id=user_id,
            content_id=parent_id,
            content_type="track",
            content_entity=parent_track,
            is_download=is_download,
        )
        return parent_access["does_user_have_access"]


content_access_checker = ContentAccessChecker()
