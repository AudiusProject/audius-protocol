import json
import logging
from typing import Dict, List, TypedDict, TypeGuard, Union, cast

from sqlalchemy.orm.session import Session
from typing_extensions import Protocol

from src.gated_content.helpers import (
    does_user_follow_artist,
    does_user_have_nft_collection,
    does_user_have_usdc_access,
    does_user_support_artist,
)
from src.gated_content.types import GatedContentConditions, GatedContentType
from src.models.playlists.playlist import Playlist
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


# user id -> content_id -> access
GatedContentAccessResult = Dict[int, Dict[int, ContentAccessResponse]]


class ContentAccessBatchResponse(TypedDict):
    # track : user id -> track id -> access
    track: GatedContentAccessResult
    # album : user id -> playlist id -> access
    album: GatedContentAccessResult


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


def is_track(
    entity: Union[Track, Playlist], content_type: GatedContentType
) -> TypeGuard[Track]:
    return content_type == "track" and isinstance(entity, Track)


def is_playlist(
    entity: Union[Track, Playlist], content_type: GatedContentType
) -> TypeGuard[Playlist]:
    return content_type == "album" and isinstance(entity, Playlist)


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
        content_entity: Union[Track, Playlist],
    ) -> ContentAccessResponse:
        if content_type != "track" and content_type != "album":
            logger.warn(
                f"gated_content_access_checker | check_access | gated content type {content_type} is not supported."
            )
            return {"has_stream_access": True, "has_download_access": True}

        # Content owner has access to their own gated content
        content_owner_id = (
            content_entity.owner_id
            if is_track(content_entity, content_type)
            else (
                content_entity.playlist_owner_id
                if (is_playlist(content_entity, content_type))
                else None
            )
        )
        if content_owner_id == user_id:
            return {"has_stream_access": True, "has_download_access": True}
        content_id = (
            content_entity.track_id
            if is_track(content_entity, content_type)
            else (
                content_entity.playlist_id
                if is_playlist(content_entity, content_type)
                else None
            )
        )
        if content_id is None:
            logger.error(
                f"gated_content_access_checker | check_access | failed to get content id for {content_type} with owner {content_owner_id}, this should never happen"
            )
            return {"has_stream_access": True, "has_download_access": True}

        # If not gated on either stream or download,
        # then check if content is a stem track and check parent track access,
        # otherwise, user has access to stream and download.
        # Note that stem tracks do not have stream/download conditions.
        content_entity_dict = helpers.model_to_dictionary(content_entity)
        stream_conditions = content_entity_dict.get("stream_conditions")
        download_conditions = content_entity_dict.get("download_conditions")
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

        # If stream gated, check stream access which also determines download access
        if stream_conditions:
            has_access = self._evaluate_conditions(
                session=session,
                user_id=user_id,
                content_id=int(content_id),
                content_type=content_type,
                conditions=cast(dict, stream_conditions),
            )
            return {"has_stream_access": has_access, "has_download_access": has_access}

        # If we reach here, it means that the
        # content is download gated and not stream gated.
        # Currently only tracks support download-gating.
        if download_conditions:
            has_download_access = self._evaluate_conditions(
                session=session,
                user_id=user_id,
                content_id=int(content_id),
                content_type=content_type,
                conditions=cast(dict, download_conditions),
            )
            return {
                "has_stream_access": True,
                "has_download_access": has_download_access,
            }

        return {"has_stream_access": True, "has_download_access": True}

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
        if not args:
            return {"track": {}, "album": {}}

        track_ids = [
            arg["content_id"] for arg in args if arg["content_type"] == "track"
        ]
        gated_track_data = self._get_gated_track_data_for_batch(session, track_ids)
        album_ids = [
            arg["content_id"] for arg in args if arg["content_type"] == "album"
        ]
        gated_album_data = self._get_gated_album_data_for_batch(session, album_ids)

        batch_access_result: ContentAccessBatchResponse = {"track": {}, "album": {}}

        for arg in args:
            content_type = arg["content_type"]
            key_type: GatedContentType = "track" if content_type == "track" else "album"
            content_id = arg["content_id"]
            user_id = arg["user_id"]
            entity = (
                gated_track_data.get(content_id)
                if content_type == "track"
                else gated_album_data.get(content_id)
            )
            if not entity:
                logging.warn(
                    f"gated_content_access_checker.py | check_access_for_batch | no entity found for {content_type} {content_id}"
                )
                continue
            if user_id not in batch_access_result[key_type]:
                batch_access_result[key_type][user_id] = {}

            # content owner has access to their own gated content
            content_owner_id = entity["content_owner_id"]
            if content_owner_id == user_id:
                batch_access_result[key_type][user_id][content_id] = {
                    "has_stream_access": True,
                    "has_download_access": True,
                }
                continue

            # if entity is not gated on either stream or download,
            # then check if entity is a stem track and check parent track access,
            # otherwise, user has access to stream and download.
            # note that stem tracks do not have stream/download conditions.
            # also note that albums only support stream_conditions.
            stream_conditions = entity.get("stream_conditions")
            download_conditions = entity.get("download_conditions")
            if not stream_conditions and not download_conditions:
                access = (
                    self._check_stem_access(
                        session=session,
                        user_id=user_id,
                        content_entity=entity,
                    )
                    if content_type == "track"
                    else True
                )
                batch_access_result[key_type][user_id][content_id] = {
                    "has_stream_access": access,
                    "has_download_access": access,
                }
                continue

            # if stream gated, check stream access which also determines download access
            if stream_conditions:
                has_access = self._evaluate_conditions(
                    session=session,
                    user_id=user_id,
                    content_id=content_id,
                    content_type=content_type,
                    conditions=stream_conditions,
                )
                batch_access_result[key_type][user_id][content_id] = {
                    "has_stream_access": has_access,
                    "has_download_access": has_access,
                }
                continue

            # if we reach here, it means that the
            # content is download gated and not stream gated
            if download_conditions:
                has_download_access = self._evaluate_conditions(
                    session=session,
                    user_id=user_id,
                    content_id=content_id,
                    content_type=content_type,
                    conditions=download_conditions,
                )
                batch_access_result[key_type][user_id][content_id] = {
                    "has_stream_access": True,
                    "has_download_access": has_download_access,
                }
                continue

            batch_access_result[key_type][user_id][content_id] = {
                "has_stream_access": True,
                "has_download_access": True,
            }

        return batch_access_result

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
                "content_type": "track",
                "is_stream_gated": track["stream_conditions"] is not None,  # type: ignore
                "stream_conditions": track["stream_conditions"],  # type: ignore
                "is_download_gated": track["download_conditions"] is not None,  # type: ignore
                "download_conditions": track["download_conditions"],  # type: ignore
                "content_owner_id": track["owner_id"],  # type: ignore
            }
            for track in tracks
        }

    def _get_gated_album_data_for_batch(
        self, session: Session, playlist_ids: List[int]
    ):
        albums = (
            session.query(Playlist)
            .filter(
                Playlist.playlist_id.in_(playlist_ids),
                Playlist.is_current == True,
                Playlist.is_delete == False,
            )
            .all()
        )
        albums = list(map(helpers.model_to_dictionary, albums))

        return {
            album["playlist_id"]: {  # type: ignore
                "content_type": "album",
                "is_stream_gated": album["is_stream_gated"],  # type: ignore
                "stream_conditions": album["stream_conditions"],  # type: ignore
                "content_owner_id": album["playlist_owner_id"],  # type: ignore
            }
            for album in albums
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

            # check content access for condition
            handler = GATED_CONDITION_TO_HANDLER_MAP[condition]
            has_access = handler(
                session=session,
                user_id=user_id,
                content_id=content_id,
                content_type=content_type,
                condition_options=condition_options,
            )
            if not has_access:
                # perhaps content was previously (not currently) purchase gated
                # so we check if user had previously purchased content
                if condition != "usdc_purchase":
                    user_purchased_content = does_user_have_usdc_access(
                        session=session,
                        user_id=user_id,
                        content_id=content_id,
                        content_type=content_type,
                        condition_options=condition_options,
                    )
                    if not user_purchased_content:
                        return False
                else:
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
