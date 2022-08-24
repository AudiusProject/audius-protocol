from datetime import datetime
from enum import Enum
from typing import Dict, List, Set, Tuple, TypedDict

from src.challenges.challenge_event_bus import ChallengeEventBus
from src.models.playlists.playlist import Playlist
from src.models.tracks.track import Track
from src.models.tracks.track_route import TrackRoute
from src.models.users.user import User
from src.utils import helpers
from web3.datastructures import AttributeDict

PLAYLIST_ID_OFFSET = 400_000
TRACK_ID_OFFSET = 1_000_000


class Action(str, Enum):
    CREATE = "Create"
    UPDATE = "Update"
    DELETE = "Delete"
    FOLLOW = "Follow"
    UNFOLLOW = "Unfollow"

    def __str__(self) -> str:
        return str.__str__(self)


class EntityType(str, Enum):
    PLAYLIST = "Playlist"
    TRACK = "Track"
    USER = "User"
    FOLLOW = "Follow"

    def __str__(self) -> str:
        return str.__str__(self)


class EntitiesToFetch(TypedDict):
    EntityType.USER: Set[int]
    EntityType.TRACK: Set[int]
    EntityType.PLAYLIST: Set[int]
    EntityType.FOLLOW: Set[Tuple]


class RecordDict(TypedDict):
    playlists: Dict[int, List[Playlist]]
    tracks: Dict[int, List[Track]]


class ExistingRecordDict(TypedDict):
    playlists: Dict[int, Playlist]
    tracks: Dict[int, Track]
    users: Dict[int, User]


MANAGE_ENTITY_EVENT_TYPE = "ManageEntity"


class ManageEntityParameters:
    def __init__(
        self,
        session,
        challenge_bus: ChallengeEventBus,
        event: AttributeDict,
        new_records: RecordDict,
        existing_records: ExistingRecordDict,
        pending_track_routes: List[TrackRoute],
        ipfs_metadata: Dict[str, Dict[str, Dict]],
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
        self.challenge_bus = challenge_bus
        self.pending_track_routes = pending_track_routes

        self.event = event
        self.ipfs_metadata = ipfs_metadata
        self.block_number = block_number
        self.event_blockhash = event_blockhash
        self.txhash = txhash
        self.new_records = new_records
        self.existing_records = existing_records

    def add_playlist_record(self, playlist_id: int, playlist: Playlist):
        self.new_records["playlists"][playlist_id].append(playlist)
        self.existing_records["playlists"][playlist_id] = playlist

    def add_track_record(self, track_id: int, track: Track):
        self.new_records["tracks"][track_id].append(track)
        self.existing_records["tracks"][track_id] = track
