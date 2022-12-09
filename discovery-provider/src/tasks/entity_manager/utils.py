import logging
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Set, Tuple, TypedDict, Union

from redis import Redis
from src.app import get_eth_abi_values
from src.challenges.challenge_event_bus import ChallengeEventBus
from src.models.notifications.notification import NotificationSeen
from src.models.playlists.playlist import Playlist
from src.models.playlists.playlist_route import PlaylistRoute
from src.models.social.follow import Follow
from src.models.social.repost import Repost
from src.models.social.save import Save
from src.models.social.subscription import Subscription
from src.models.tracks.track import Track
from src.models.tracks.track_route import TrackRoute
from src.models.users.user import User
from src.utils import helpers, web3_provider
from src.utils.config import shared_config
from src.utils.eth_contracts_helpers import (
    cnode_info_redis_ttl_s,
    content_node_service_type,
    sp_factory_registry_key,
)
from src.utils.eth_manager import EthManager
from src.utils.redis_cache import (
    get_cn_sp_id_key,
    get_json_cached_key,
    set_json_cached_key,
)
from web3 import Web3
from web3.datastructures import AttributeDict

PLAYLIST_ID_OFFSET = 400_000
TRACK_ID_OFFSET = 2_000_000
USER_ID_OFFSET = 3_000_000

logger = logging.getLogger(__name__)


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
    NOTIFICATION = "Notification"

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
    Notification: Dict[Tuple, List[NotificationSeen]]


class ExistingRecordDict(TypedDict):
    Playlist: Dict[int, Playlist]
    Track: Dict[int, Track]
    User: Dict[int, User]
    Follow: Dict[Tuple, Follow]
    Save: Dict[Tuple, Save]
    Subscription: Dict[Tuple, Subscription]


class EntitiesToFetchDict(TypedDict):
    Playlist: Set[int]
    Track: Set[int]
    User: Set[int]
    Follow: Set[Tuple]
    Save: Set[Tuple]
    Subscription: Set[Tuple]


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

    def add_user_record(self, user_id: int, user: User):
        self.new_records[EntityType.USER][user_id].append(user)  # type: ignore
        self.existing_records[EntityType.USER][user_id] = user  # type: ignore

    def add_notification_seen_record(
        self,
        key: Tuple[int, datetime],
        record: NotificationSeen,
    ):
        if key not in self.new_records[EntityType.NOTIFICATION]:  # type: ignore
            self.new_records[EntityType.NOTIFICATION][key].append(record)  # type: ignore
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


# Reconstruct endpoint string from primary and secondary IDs
# Attempt to retrieve from cached values populated in index_network_peers.py
# If unavailable, then a fallback to ethereum mainnet contracts will occur
# Note that in the case of an invalid spID - one that is not yet registered on
# the ethereum mainnet contracts, there will be an empty value in the returned
# creator_node_endpoint
# If this discrepancy occurs, a client replica set health check sweep will
# result in a client-initiated failover operation to a valid set of replicas
def get_endpoint_string_from_sp_ids(
    redis: Redis, primary: int, secondaries: List[int]
) -> str:
    sp_factory_inst = None
    endpoint_string = None
    primary_endpoint = None
    try:
        sp_factory_inst, primary_endpoint = get_endpoint_from_id(
            redis, sp_factory_inst, primary
        )
        endpoint_string = f"{primary_endpoint}"
        for secondary_id in secondaries:
            secondary_endpoint = None
            sp_factory_inst, secondary_endpoint = get_endpoint_from_id(
                redis, sp_factory_inst, secondary_id
            )
            # Conditionally log if endpoint is None after fetching
            if not secondary_endpoint:
                logger.info(
                    f"index.py | utils.py | Failed to find secondary info for {secondary_id}"
                )
            # Append to endpoint string regardless of status
            endpoint_string = f"{endpoint_string},{secondary_endpoint}"
    except Exception as exc:
        logger.error(
            f"index.py | utils.py | ERROR in get_endpoint_string_from_sp_ids {exc}"
        )
        raise exc
    logger.info(
        f"index.py | utils.py | constructed:"
        f"{endpoint_string} from {primary},{secondaries}",
        exc_info=True,
    )
    return endpoint_string


# Initializes sp_factory if necessary and retrieves spID
# Returns initialized instance of contract and endpoint
def get_endpoint_from_id(redis: Redis, sp_factory_inst, sp_id: int) -> Tuple[Any, str]:
    endpoint = None
    # Get sp_id cache key
    cache_key = get_cn_sp_id_key(sp_id)
    # Attempt to fetch from cache
    sp_info_cached = get_json_cached_key(redis, cache_key)
    if sp_info_cached:
        endpoint = sp_info_cached[1]
        logger.info(
            f"index.py | utils.py | CACHE HIT FOR {cache_key}, found {sp_info_cached}"
        )
        return sp_factory_inst, endpoint

    if not endpoint:
        logger.info(
            f"index.py | utils.py | CACHE MISS FOR {cache_key}, found {sp_info_cached}"
        )
        if sp_factory_inst is None:
            sp_factory_inst = get_sp_factory_inst()

        cn_endpoint_info = sp_factory_inst.functions.getServiceEndpointInfo(
            content_node_service_type, sp_id
        ).call()
        logger.info(f"index.py | utils.py | spID={sp_id} fetched {cn_endpoint_info}")
        set_json_cached_key(redis, cache_key, cn_endpoint_info, cnode_info_redis_ttl_s)
        endpoint = cn_endpoint_info[1]

    return sp_factory_inst, endpoint


# Return instance of ServiceProviderFactory initialized with configs
def get_sp_factory_inst():
    eth_web3 = web3_provider.get_eth_web3()
    eth_registry_address = eth_web3.toChecksumAddress(
        shared_config["eth_contracts"]["registry"]
    )
    eth_registry_instance = eth_web3.eth.contract(
        address=eth_registry_address, abi=get_eth_abi_values()["Registry"]["abi"]
    )
    sp_factory_address = eth_registry_instance.functions.getContract(
        sp_factory_registry_key
    ).call()
    sp_factory_inst = eth_web3.eth.contract(
        address=sp_factory_address,
        abi=get_eth_abi_values()["ServiceProviderFactory"]["abi"],
    )
    return sp_factory_inst
