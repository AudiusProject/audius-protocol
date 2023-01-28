from datetime import datetime
from enum import Enum
from typing import Dict, List, Set, Tuple, TypedDict, Union

from src.challenges.challenge_event_bus import ChallengeEventBus
from src.models.notifications.notification import (
    Notification,
    NotificationSeen,
    PlaylistSeen,
)
from src.models.playlists.playlist import Playlist
from src.models.playlists.playlist_route import PlaylistRoute
from src.models.social.follow import Follow
from src.models.social.repost import Repost
from src.models.social.save import Save
from src.models.social.subscription import Subscription
from src.models.tracks.track import Track
from src.models.tracks.track_route import TrackRoute
from src.models.users.user import User
from src.utils import helpers
from src.utils.eth_manager import EthManager
from web3 import Web3
from web3.datastructures import AttributeDict

PLAYLIST_ID_OFFSET = 400_000
TRACK_ID_OFFSET = 2_000_000
USER_ID_OFFSET = 3_000_000


class Action(str, Enum):
    CREATE = "Create"
    UPDATE = "Update"
    DELETE = "Delete"
    FOLLOW = "Follow"
    UNFOLLOW = "Unfollow"
    SAVE = "Save"
    UNSAVE = "Unsave"
    REPOST = "Repost"
    UNREPOST = "Unrepost"
    VERIFY = "Verify"
    SUBSCRIBE = "Subscribe"
    UNSUBSCRIBE = "Unsubscribe"
    VIEW = "View"
    VIEW_PLAYLIST = "ViewPlaylist"

    def __str__(self) -> str:
        return str.__str__(self)


class EntityType(str, Enum):
    PLAYLIST = "Playlist"
    TRACK = "Track"
    USER = "User"
    USER_REPLICA_SET = "UserReplicaSet"
    FOLLOW = "Follow"
    SAVE = "Save"
    REPOST = "Repost"
    SUBSCRIPTION = "Subscription"
    NOTIFICATION_SEEN = "NotificationSeen"
    NOTIFICATION = "Notification"
    PLAYLIST_SEEN = "PlaylistSeen"

    def __str__(self) -> str:
        return str.__str__(self)


class RecordDict(TypedDict):
    Playlist: Dict[int, List[Playlist]]
    Track: Dict[int, List[Track]]
    User: Dict[int, List[User]]
    Follow: Dict[Tuple, List[Follow]]
    Save: Dict[Tuple, List[Save]]
    Repost: Dict[Tuple, List[Repost]]
    Subscription: Dict[Tuple, List[Subscription]]
    NotificationSeen: Dict[Tuple, List[NotificationSeen]]
    Notification: Dict[Tuple, List[Notification]]
    PlaylistSeen: Dict[Tuple, List[PlaylistSeen]]


class ExistingRecordDict(TypedDict):
    Playlist: Dict[int, Playlist]
    Track: Dict[int, Track]
    User: Dict[int, User]
    Follow: Dict[Tuple, Follow]
    Save: Dict[Tuple, Save]
    Subscription: Dict[Tuple, Subscription]
    PlaylistSeen: Dict[Tuple, PlaylistSeen]


class EntitiesToFetchDict(TypedDict):
    Playlist: Set[int]
    Track: Set[int]
    User: Set[int]
    Follow: Set[Tuple]
    Save: Set[Tuple]
    Subscription: Set[Tuple]
    PlaylistSeen: Set[Tuple]


MANAGE_ENTITY_EVENT_TYPE = "ManageEntity"


class ManageEntityParameters:
    def __init__(
        self,
        session,
        redis,
        challenge_bus: ChallengeEventBus,
        event: AttributeDict,
        new_records: RecordDict,
        existing_records: ExistingRecordDict,
        pending_track_routes: List[TrackRoute],
        pending_playlist_routes: List[PlaylistRoute],
        metadata: Dict[str, Dict[str, Dict]],
        eth_manager: EthManager,
        web3: Web3,
        block_timestamp: int,
        block_number: int,
        event_blockhash: str,
        txhash: str,
    ):
        self.user_id = helpers.get_tx_arg(event, "_userId")
        self.entity_id = helpers.get_tx_arg(event, "_entityId")
        self.entity_type = helpers.get_tx_arg(event, "_entityType")
        self.action = helpers.get_tx_arg(event, "_action")
        self.metadata_cid = helpers.get_tx_arg(event, "_metadata")
        self.signer = helpers.get_tx_arg(event, "_signer")
        self.block_datetime = datetime.utcfromtimestamp(block_timestamp)
        self.block_integer_time = int(block_timestamp)

        self.session = session
        self.redis = redis
        self.challenge_bus = challenge_bus
        self.web3 = web3
        self.eth_manager = eth_manager
        self.pending_track_routes = pending_track_routes
        self.pending_playlist_routes = pending_playlist_routes

        self.event = event
        self.metadata = metadata
        self.block_number = block_number
        self.event_blockhash = event_blockhash
        self.txhash = txhash
        self.new_records = new_records
        self.existing_records = existing_records

    def add_playlist_record(self, playlist_id: int, playlist: Playlist):
        self.new_records[EntityType.PLAYLIST][playlist_id].append(playlist)  # type: ignore
        self.existing_records[EntityType.PLAYLIST][playlist_id] = playlist  # type: ignore

    def add_track_record(self, track_id: int, track: Track):
        self.new_records[EntityType.TRACK][track_id].append(track)  # type: ignore
        self.existing_records[EntityType.TRACK][track_id] = track  # type: ignore

    def add_social_feature_record(
        self,
        user_id: int,
        entity_type: EntityType,
        entity_id: int,
        record_type: EntityType,
        record,
    ):
        key = get_record_key(user_id, entity_type, entity_id)
        self.new_records[record_type][key].append(record)  # type: ignore
        self.existing_records[record_type][key] = record  # type: ignore

    def add_user_record(self, user_id: int, user: User):
        self.new_records[EntityType.USER][user_id].append(user)  # type: ignore
        self.existing_records[EntityType.USER][user_id] = user  # type: ignore

    def add_notification_seen_record(
        self,
        key: Tuple[int, datetime],
        record: NotificationSeen,
    ):
        if key not in self.new_records[EntityType.NOTIFICATION_SEEN]:  # type: ignore
            self.new_records[EntityType.NOTIFICATION_SEEN][key].append(record)  # type: ignore
        # If key exists, do nothing

    def add_notification_record(
        self,
        key: datetime,
        record: NotificationSeen,
    ):
        if key not in self.new_records[EntityType.NOTIFICATION]:  # type: ignore
            self.new_records[EntityType.NOTIFICATION][key].append(record)  # type: ignore
        # If key exists, do nothing

    def add_playlist_seen_record(
        self,
        key: Tuple[int, int],
        record: PlaylistSeen,
    ):
        if key not in self.new_records[EntityType.PLAYLIST_SEEN]:  # type: ignore
            self.new_records[EntityType.PLAYLIST_SEEN][key].append(record)  # type: ignore
            self.existing_records[EntityType.PLAYLIST_SEEN][key] = record  # type: ignore
        # If key exists, do nothing


def get_record_key(user_id: int, entity_type: str, entity_id: int):
    return (user_id, entity_type.capitalize(), entity_id)


def copy_record(
    old_record: Union[User, Track, Playlist],
    block_number: int,
    event_blockhash: str,
    txhash: str,
    block_datetime: datetime,
):
    old_user_attributes = old_record.get_attributes_dict()
    record_copy = type(old_record)()
    for key, value in old_user_attributes.items():
        if key == "is_current":
            setattr(record_copy, key, False)
        elif key == "updated_at":
            setattr(record_copy, key, block_datetime)
        elif key == "blocknumber":
            setattr(record_copy, key, block_number)
        elif key == "blockhash":
            setattr(record_copy, key, event_blockhash)
        elif key == "txhash":
            setattr(record_copy, key, txhash)
        else:
            setattr(record_copy, key, value)
    return record_copy
