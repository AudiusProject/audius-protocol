from datetime import datetime
from enum import Enum
from typing import Dict, List, Set, Tuple, TypedDict

from src.challenges.challenge_event_bus import ChallengeEventBus
from src.models.playlists.playlist import Playlist
from src.models.social.follow import Follow
from src.models.social.repost import Repost
from src.models.social.save import Save
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

    def __str__(self) -> str:
        return str.__str__(self)


class RecordDict(TypedDict):
    Playlist: Dict[int, List[Playlist]]
    Track: Dict[int, List[Track]]
    User: Dict[int, List[User]]
    Follow: Dict[Tuple, List[Follow]]
    Save: Dict[Tuple, List[Save]]
    Repost: Dict[Tuple, List[Repost]]


class ExistingRecordDict(TypedDict):
    Playlist: Dict[int, Playlist]
    Track: Dict[int, Track]
    User: Dict[int, User]
    Follow: Dict[Tuple, Follow]
    Save: Dict[Tuple, Save]


class EntitiesToFetchDict(TypedDict):
    Playlist: Set[int]
    Track: Set[int]
    User: Set[int]
    Follow: Set[Tuple]
    Save: Set[Tuple]


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

    def add_user_record(self, user_id: int, user: User):
        self.new_records[EntityType.USER][user_id].append(user)  # type: ignore
        self.existing_records[EntityType.USER][user_id] = user  # type: ignore


def get_record_key(user_id: int, entity_type: str, entity_id: int):
    return (user_id, entity_type.capitalize(), entity_id)


def copy_user_record(
    old_user: User,
    block_number: int,
    event_blockhash: str,
    txhash: str,
    block_datetime: datetime,
):
    return User(
        user_id=old_user.user_id,
        wallet=old_user.wallet,
        created_at=old_user.created_at,
        handle=old_user.handle,
        name=old_user.name,
        profile_picture=old_user.profile_picture,
        cover_photo=old_user.cover_photo,
        bio=old_user.bio,
        location=old_user.location,
        metadata_multihash=old_user.metadata_multihash,
        creator_node_endpoint=old_user.creator_node_endpoint,
        is_verified=old_user.is_verified,
        handle_lc=old_user.handle_lc,
        cover_photo_sizes=old_user.cover_photo_sizes,
        profile_picture_sizes=old_user.profile_picture_sizes,
        primary_id=old_user.primary_id,
        secondary_ids=old_user.secondary_ids,
        replica_set_update_signer=old_user.replica_set_update_signer,
        has_collectibles=old_user.has_collectibles,
        playlist_library=old_user.playlist_library,
        is_deactivated=old_user.is_deactivated,
        slot=old_user.slot,
        user_storage_account=old_user.user_storage_account,
        user_authority_account=old_user.user_authority_account,
        updated_at=block_datetime,
        blocknumber=block_number,
        blockhash=event_blockhash,
        txhash=txhash,
        artist_pick_track_id=old_user.artist_pick_track_id,
        is_current=False,
    )
