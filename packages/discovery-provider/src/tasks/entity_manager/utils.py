import json
from datetime import datetime
from enum import Enum
from typing import Dict, List, Literal, Set, Tuple, TypedDict, Union

from eth_account.messages import defunct_hash_message
from multiformats import CID, multihash
from sqlalchemy.orm.session import Session
from web3 import Web3
from web3.datastructures import AttributeDict

from src.challenges.challenge_event_bus import ChallengeEventBus
from src.exceptions import IndexingValidationError
from src.models.dashboard_wallet_user.dashboard_wallet_user import DashboardWalletUser
from src.models.grants.developer_app import DeveloperApp
from src.models.grants.grant import Grant
from src.models.indexing.cid_data import CIDData
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
from src.tasks.metadata import (
    playlist_metadata_format,
    track_metadata_format,
    user_metadata_format,
)
from src.utils import helpers, web3_provider
from src.utils.eth_manager import EthManager
from src.utils.structured_logger import StructuredLogger

utils_logger = StructuredLogger(__name__)

PLAYLIST_ID_OFFSET = 400_000
TRACK_ID_OFFSET = 2_000_000
USER_ID_OFFSET = 3_000_000

# limits
CHARACTER_LIMIT_USER_BIO = 250
CHARACTER_LIMIT_DESCRIPTION = 1000
PLAYLIST_TRACK_LIMIT = 5000


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
    DASHBOARD_WALLET_USER = "DashboardWalletUser"
    USER_REPLICA_SET = "UserReplicaSet"
    FOLLOW = "Follow"
    SAVE = "Save"
    REPOST = "Repost"
    SUBSCRIPTION = "Subscription"
    NOTIFICATION_SEEN = "NotificationSeen"
    NOTIFICATION = "Notification"
    PLAYLIST_SEEN = "PlaylistSeen"
    DEVELOPER_APP = "DeveloperApp"
    GRANT = "Grant"
    ASSOCIATED_WALLET = "AssociatedWallet"
    USER_EVENT = "UserEvent"
    STEM = "Stem"
    REMIX = "Remix"
    TRACK_ROUTE = "TrackRoute"
    PLAYLIST_ROUTE = "PlaylistRoute"

    def __str__(self) -> str:
        return str.__str__(self)


EntityTypeLiteral = Literal[
    "Playlist",
    "Track",
    "User",
    "Follow",
    "Save",
    "Repost",
    "Subscription",
    "PlaylistSeen",
    "DeveloperApp",
    "Grant",
    "DashboardWalletUser",
]


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
    DeveloperApp: Dict[str, List[DeveloperApp]]
    DashboardWalletUser: Dict[str, List[DashboardWalletUser]]
    Grant: Dict[Tuple, List[Grant]]


class ExistingRecordDict(TypedDict):
    Playlist: Dict[int, Playlist]
    Track: Dict[int, Track]
    User: Dict[int, User]
    Follow: Dict[Tuple, Follow]
    Save: Dict[Tuple, Save]
    Repost: Dict[Tuple, Repost]
    Subscription: Dict[Tuple, Subscription]
    PlaylistSeen: Dict[Tuple, PlaylistSeen]
    DeveloperApp: Dict[str, DeveloperApp]
    DashboardWalletUser: Dict[str, DashboardWalletUser]
    Grant: Dict[Tuple, Grant]
    TrackRoute: Dict[int, TrackRoute]
    PlaylistRoute: Dict[int, PlaylistRoute]


class EntitiesToFetchDict(TypedDict):
    Playlist: Set[int]
    Track: Set[int]
    User: Set[int]
    Follow: Set[Tuple]
    Save: Set[Tuple]
    Repost: Set[Tuple]
    Subscription: Set[Tuple]
    PlaylistSeen: Set[Tuple]
    Grant: Set[Tuple]
    DeveloperApp: Set[str]
    DashboardWalletUser: Set[str]
    TrackRoute: Set[int]
    PlaylistRoute: Set[int]
    UserEvent: Set[int]
    AssociatedWallet: Set[int]


MANAGE_ENTITY_EVENT_TYPE = "ManageEntity"


class ManageEntityParameters:
    """
    A set of parameters for processing a single transactions.

    Most importantly,
    event: the decoded transaction
    new_records: compiles new records based on all transactions in this block
    existing_records: a view of current records relevant to this block

    """

    def __init__(
        self,
        session: Session,
        redis,
        challenge_bus: ChallengeEventBus,
        event: AttributeDict,
        new_records: RecordDict,
        existing_records: ExistingRecordDict,
        pending_track_routes: List[TrackRoute],
        pending_playlist_routes: List[PlaylistRoute],
        eth_manager: EthManager,
        web3: Web3,
        block_timestamp: int,
        block_number: int,
        event_blockhash: str,
        txhash: str,
        logger: StructuredLogger,
    ):
        self.user_id = helpers.get_tx_arg(event, "_userId")
        self.entity_id = helpers.get_tx_arg(event, "_entityId")
        self.entity_type: EntityTypeLiteral = helpers.get_tx_arg(event, "_entityType")
        self.action = helpers.get_tx_arg(event, "_action")
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
        self.metadata, self.metadata_cid = parse_metadata(
            helpers.get_tx_arg(event, "_metadata"), self.action, self.entity_type
        )
        self.block_number = block_number
        self.event_blockhash = event_blockhash
        self.txhash = txhash
        self.new_records = new_records
        self.existing_records = existing_records
        self.logger = logger  # passed in with EM context

    def add_record(self, key, record, record_type=None):
        if not record_type:
            record_type = self.entity_type
        # add to new records to insert
        self.new_records[record_type][key].append(record)  # type: ignore

        # overwrite the current version of this record
        self.existing_records[record_type][key] = record  # type: ignore

    def add_notification_seen_record(
        self,
        key: Tuple[int, datetime],
        record: NotificationSeen,
    ):
        # notification_seen does not have is_current
        if key not in self.new_records[EntityType.NOTIFICATION_SEEN]:  # type: ignore
            self.new_records[EntityType.NOTIFICATION_SEEN][key].append(record)  # type: ignore
        # If key exists, do nothing

    def add_notification_record(
        self,
        key: datetime,
        record: Notification,
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


# Whether to expect valid metadata json based on the action and entity type
def expect_cid_metadata_json(metadata, action, entity_type):
    # TODO after single tx sign up is fully rolled out, expect metadata
    # for CREATE USER txs, so remove this clause
    if action == Action.CREATE and entity_type == EntityType.USER:
        return False
    # TODO(michelle) validate metadata for notification, developer app,
    # and grant types here
    if entity_type in [
        EntityType.NOTIFICATION,
        EntityType.GRANT,
        EntityType.DEVELOPER_APP,
        EntityType.DASHBOARD_WALLET_USER,
        EntityType.USER_REPLICA_SET,
    ]:
        return False
    if action in [
        Action.REPOST,
        Action.UNREPOST,
        Action.SAVE,
        Action.UNSAVE,
        Action.FOLLOW,
        Action.UNFOLLOW,
        Action.SUBSCRIBE,
        Action.UNSUBSCRIBE,
    ]:
        return False
    if not metadata:
        return False
    return True


# Returns metadata_type, metadata_format
def get_metadata_type_and_format(entity_type):
    if entity_type == EntityType.PLAYLIST:
        metadata_type = "playlist_data"
        metadata_format = playlist_metadata_format
    elif entity_type == EntityType.TRACK:
        metadata_type = "track"
        metadata_format = track_metadata_format
    elif entity_type == EntityType.USER:
        metadata_type = "user"
        metadata_format = user_metadata_format
    else:
        raise IndexingValidationError(f"Unknown metadata type ${entity_type}")
    return metadata_type, metadata_format


def get_metadata_from_json(default_metadata_fields, resp_json):
    metadata = {}
    for parameter, value in default_metadata_fields.items():
        metadata[parameter] = (
            resp_json.get(parameter) if resp_json.get(parameter) is not None else value
        )
    return metadata


def sanitize_json(json_resp):
    sanitized_data = (
        json.dumps(json_resp, ensure_ascii=False)
        .encode("utf-8", "ignore")
        .decode("utf-8", "ignore")
    )
    return json.loads(sanitized_data)


# Returns metadata, cid
def parse_metadata(metadata: str, action: str, entity_type: str):
    if not expect_cid_metadata_json(metadata, action, entity_type):
        return metadata, None
    try:
        data = sanitize_json(json.loads(metadata))

        if "cid" not in data.keys() or "data" not in data.keys():
            raise IndexingValidationError("required keys missing in metadata")

        cid = data["cid"]
        metadata_json = data["data"]

        # Handle old client compatibility for gated fields until clients are updated
        # todo: remove once clients are updated with new stream and gated fields
        is_old_client_track = "premium_conditions" in metadata_json
        if is_old_client_track:
            download = (
                metadata_json["download"] if metadata_json.get("download") else {}
            )
            is_downloadable = download.get("is_downloadable") is True
            metadata_json["is_downloadable"] = is_downloadable
            metadata_json["is_stream_gated"] = metadata_json["is_premium"]
            metadata_json["stream_conditions"] = metadata_json["premium_conditions"]
            metadata_json["is_download_gated"] = (
                metadata_json["is_premium"] if is_downloadable else False
            )
            metadata_json["download_conditions"] = (
                metadata_json["premium_conditions"] if is_downloadable else False
            )
            metadata_json["is_original_available"] = False
            metadata_json["orgi_file_cid"] = None
            metadata_json["orig_filename"] = None

        # Don't format metadata for UPDATEs
        # This is to support partial updates
        # Individual entities are responsible for updating existing records with metadata
        if action != Action.UPDATE:
            _, metadata_format = get_metadata_type_and_format(entity_type)
            formatted_json = get_metadata_from_json(metadata_format, metadata_json)

            # Only index valid changes
            if formatted_json == metadata_format:
                raise IndexingValidationError("no valid metadata changes detected")
        else:
            formatted_json = metadata_json

        return formatted_json, cid
    except Exception as e:
        utils_logger.info(
            f"entity_manager.py | utils.py | error deserializing metadata {metadata}: {e}"
        )
        raise IndexingValidationError(e)


def save_cid_metadata(
    session: Session, cid_metadata: Dict[str, Dict], cid_type: Dict[str, str]
):
    if not cid_metadata:
        return

    for cid, val in cid_metadata.items():
        cid_data = CIDData(cid=cid, type=cid_type[cid], data=val)
        session.merge(cid_data)


def get_record_key(user_id: int, entity_type: str, entity_id: int):
    return (user_id, entity_type.capitalize(), entity_id)


def copy_record(
    old_record: Union[User, Track, Playlist, DeveloperApp, Grant, DashboardWalletUser],
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


# Resets all context fields attached to last processed event.
def reset_entity_manager_event_tx_context(logger: StructuredLogger, eventArgs: dict):
    logger.update_context(eventArgs)
    logger.reset_context_key("isApp")
    logger.reset_context_key("appName")
    logger.reset_context_key("userHandle")


def validate_signer(params: ManageEntityParameters):
    # Ensure the signer is either the user or authorized to perform action for the user
    if params.user_id not in params.existing_records["User"]:
        raise IndexingValidationError(f"User {params.user_id} does not exist")
    wallet = params.existing_records["User"][params.user_id].wallet
    signer = params.signer.lower()
    signer_matches_user = wallet and wallet.lower() == signer
    if signer_matches_user:
        params.logger.set_context("isApp", "false")
    else:
        params.logger.set_context("isApp", "unknown")
        grant_key = (signer, params.user_id)
        is_signer_authorized = grant_key in params.existing_records["Grant"]
        if is_signer_authorized:
            grant = params.existing_records["Grant"][grant_key]
            developer_app = params.existing_records["DeveloperApp"][signer]
            if (not developer_app) or (developer_app.is_delete) or (grant.is_revoked):
                raise IndexingValidationError(
                    f"Signer is not authorized to perform action for user {params.user_id}"
                )
            params.logger.set_context("isApp", "true")
            params.logger.set_context(
                "appName",
                params.existing_records["DeveloperApp"][signer].name,
            )
            params.logger.set_context(
                "userHandle",
                params.existing_records["User"][params.user_id].handle,
            )
        else:
            raise IndexingValidationError(
                f"Signer does not match user {params.user_id} or an authorized wallet"
            )


# Generate a cid from a json object
def generate_metadata_cid_v1(metadata: object):
    encoded_metadata = json.dumps(metadata).encode("utf-8")
    bytes = bytearray(encoded_metadata)
    hash = multihash.digest(bytes, "sha2-256")
    return CID("base32", 1, "json", hash)


# Signature should be of the form: { signature: string, message: string }
def get_address_from_signature(signature):
    web3 = web3_provider.get_eth_web3()
    message_hash = defunct_hash_message(text=signature["message"])
    app_address = web3.eth.account._recover_hash(
        message_hash, signature=signature["signature"]
    )
    return app_address.lower()
