import json
import logging
from typing import Dict, List, TypedDict, Union, cast

from sqlalchemy.orm.session import Session
from typing_extensions import Protocol

from src.gated_content.helpers import (
    does_user_follow_artist,
    does_user_have_nft_collection,
    does_user_have_usdc_access,
    does_user_support_artist,
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
    has_stream_access: bool
    has_download_access: bool


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
    "usdc_purchase": does_user_have_usdc_access,
}


class ContentAccessChecker:
    # Given a user id, gated content id, and gated content type, and gated content entity,
    # this method checks for access to the gated contents by the users.
    #
    # Returns:
    # {
    #   "has_stream_access": bool
    #   "has_download_access": bool
    # }
    def check_access(
        self,
        session: Session,
        user_id: int,
        content_type: GatedContentType,
        content_entity: Track,
    ) -> ContentAccessResponse:
        if content_type != "track" and content_type != "album":
            logger.warn(
                f"gated_content_access_checker | check_access | gated content type {content_type} is not supported."
            )
            return {"has_stream_access": True, "has_download_access": True}

        # content owner has access to their own gated content
        content_owner_id = content_entity.owner_id
        if content_owner_id == user_id:
            return {"has_stream_access": True, "has_download_access": True}

        # if not gated on either stream or download,
        # then check if content is a stem track and check parent track access,
        # otherwise, user has access to stream and download.
        # note that stem tracks do not have stream/download conditions.
        stream_conditions = content_entity.stream_conditions
        download_conditions = content_entity.download_conditions
        if (
            content_type == "track"
            and not stream_conditions
            and not download_conditions
        ):
            access = self._check_stem_access(
                session=session,
                user_id=user_id,
                content_entity=helpers.model_to_dictionary(content_entity),
            )
            return {"has_stream_access": access, "has_download_access": access}

        # if stream gated, check stream access which also determines download access
        if stream_conditions:
            has_access = self._evaluate_conditions(
                session=session,
                user_id=user_id,
                content_id=content_entity.track_id,
                content_type="track",
                conditions=cast(dict, stream_conditions),
            )
            return {"has_stream_access": has_access, "has_download_access": has_access}

        # if we reach here, it means that the
        # content is download gated and not stream gated
        has_download_access = self._evaluate_conditions(
            session=session,
            user_id=user_id,
            content_id=content_entity.track_id,
            content_type="track",
            conditions=cast(dict, download_conditions),
        )
        return {"has_stream_access": True, "has_download_access": has_download_access}

    # Given a list of objects, each with a user id, gated content id, and gated content type,
    # this method checks for access to the gated contents by the users.
    #
    # Returns a dictionary in the following format:
    # {
    #   <gated-content-type>: {
    #     <user-id>: {
    #       <track-id>: {
    #         "has_stream_access": bool
    #         "has_download_access": bool
    #       }
    #     }
    #   }
    # }
    def check_access_for_batch(
        self,
        session: Session,
        args: List[ContentAccessBatchArgs],
    ) -> ContentAccessBatchResponse:
        # for now, we only allow tracks to be gated; gated playlists/albums will come later
        valid_args = list(filter(lambda arg: arg["content_type"] == "track", args))

        if not valid_args:
            return {"track": {}}

        track_access_users: Dict[int, List[int]] = {}
        for arg in valid_args:
            if arg["content_id"] not in track_access_users:
                track_access_users[arg["content_id"]] = []
            track_access_users[arg["content_id"]].append(arg["user_id"])

        gated_track_data = self._get_gated_track_data_for_batch(
            session, list(track_access_users.keys())
        )

        track_access_result: GatedTrackAccessResult = {}

        for track_id, track_entity in gated_track_data.items():
            user_ids = track_access_users[track_id]
            for user_id in user_ids:
                if user_id not in track_access_result:
                    track_access_result[user_id] = {}

                # content owner has access to their own gated content
                content_owner_id = track_entity["content_owner_id"]
                if content_owner_id == user_id:
                    track_access_result[user_id][track_id] = {
                        "has_stream_access": True,
                        "has_download_access": True,
                    }
                    continue

                # if not gated on either stream or download,
                # then check if track is a stem track and check parent track access,
                # otherwise, user has access to stream and download.
                # note that stem tracks do not have stream/download conditions.
                stream_conditions = track_entity["stream_conditions"]
                download_conditions = track_entity["download_conditions"]
                if not stream_conditions and not download_conditions:
                    access = self._check_stem_access(
                        session=session,
                        user_id=user_id,
                        content_entity=track_entity,
                    )
                    track_access_result[user_id][track_id] = {
                        "has_stream_access": access,
                        "has_download_access": access,
                    }
                    continue

                # if stream gated, check stream access which also determines download access
                if stream_conditions:
                    has_access = self._evaluate_conditions(
                        session=session,
                        user_id=user_id,
                        content_id=track_id,
                        content_type="track",
                        conditions=stream_conditions,
                    )
                    track_access_result[user_id][track_id] = {
                        "has_stream_access": has_access,
                        "has_download_access": has_access,
                    }
                    continue

                # if we reach here, it means that the
                # content is download gated and not stream gated
                has_download_access = self._evaluate_conditions(
                    session=session,
                    user_id=user_id,
                    content_id=track_id,
                    content_type="track",
                    conditions=download_conditions,
                )
                track_access_result[user_id][track_id] = {
                    "has_stream_access": True,
                    "has_download_access": has_download_access,
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

    def _evaluate_conditions(
        self,
        session: Session,
        user_id: int,
        content_id: int,
        content_type: GatedContentType,
        conditions: dict,
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
        return True

    def _check_stem_access(
        self,
        session: Session,
        user_id: int,
        content_entity: dict,
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
            content_type="track",
            content_entity=parent_track,
        )
        return parent_access["has_download_access"]


content_access_checker = ContentAccessChecker()
