# pylint: disable=C0302
import concurrent.futures
import logging
import math
from operator import itemgetter

from src.app import get_contract_addresses
from src.challenges.challenge_event_bus import ChallengeEventBus
from src.challenges.trending_challenge import should_trending_challenge_update
from src.models import (
    AssociatedWallet,
    Block,
    Follow,
    Playlist,
    Repost,
    Save,
    Track,
    TrackRoute,
    URSMContentNode,
    User,
    UserEvents,
)
from src.models.models import SkippedTransaction, SkippedTransactionLevel
from src.queries.confirm_indexing_transaction_error import (
    confirm_indexing_transaction_error,
)
from src.queries.get_skipped_transactions import (
    clear_indexing_error,
    get_indexing_error,
    set_indexing_error,
)
from src.queries.skipped_transactions import add_network_level_skipped_transaction
from src.tasks.celery_app import celery
from src.tasks.index import fetch_tx_receipt
from src.tasks.ipld_blacklist import is_blacklisted_ipld
from src.tasks.metadata import track_metadata_format, user_metadata_format
from src.tasks.playlists import playlist_state_update
from src.tasks.social_features import social_feature_state_update
from src.tasks.tracks import track_event_types_lookup, track_state_update
from src.tasks.user_library import user_library_state_update
from src.tasks.user_replica_set import user_replica_set_state_update
from src.tasks.users import user_event_types_lookup, user_state_update
from src.utils import helpers, multihash
from src.utils.constants import CONTRACT_NAMES_ON_CHAIN, CONTRACT_TYPES
from src.utils.get_all_other_nodes import get_all_other_nodes
from src.utils.indexing_errors import IndexingError
from src.utils.redis_constants import (
    latest_block_hash_redis_key,
    latest_block_redis_key,
    most_recent_indexed_block_hash_redis_key,
    most_recent_indexed_block_redis_key,
)
from src.utils.session_manager import SessionManager

logger = logging.getLogger(__name__)


# ####### CONSTANTS ####### #
CONTRACT_NAME_TO_MODEL = {}

USER_FACTORY_CONTRACT_NAME = CONTRACT_NAMES_ON_CHAIN[CONTRACT_TYPES.USER_FACTORY]
TRACK_FACTORY_CONTRACT_NAME = CONTRACT_NAMES_ON_CHAIN[CONTRACT_TYPES.TRACK_FACTORY]
SOCIAL_FEATURE_FACTORY_CONTRACT_NAME = CONTRACT_NAMES_ON_CHAIN[
    CONTRACT_TYPES.SOCIAL_FEATURE_FACTORY
]
PLAYLIST_FACTORY_CONTRACT_NAME = CONTRACT_NAMES_ON_CHAIN[
    CONTRACT_TYPES.PLAYLIST_FACTORY
]
USER_LIBRARY_FACTORY_CONTRACT_NAME = CONTRACT_NAMES_ON_CHAIN[
    CONTRACT_TYPES.USER_LIBRARY_FACTORY
]
USER_REPLICA_SET_MANAGER_CONTRACT_NAME = CONTRACT_NAMES_ON_CHAIN[
    CONTRACT_TYPES.USER_REPLICA_SET_MANAGER
]

# ####### HELPER FUNCTIONS ####### #
def get_skipped_transactions(session):
    skipped_tx = (
        session.query(SkippedTransaction)
        .filter(SkippedTransaction.level == SkippedTransactionLevel.node)
        .all()
    )
    return skipped_tx


def fetch_missing_tx_receipts(txs):
    tx_receipts = {}
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        future_to_tx_receipt = {executor.submit(fetch_tx_receipt, tx): tx for tx in txs}
        for future in concurrent.futures.as_completed(future_to_tx_receipt):
            tx = future_to_tx_receipt[future]
            try:
                tx_receipt_info = future.result()
                tx_hash = tx_receipt_info["tx_hash"]
                tx_receipts[tx_hash] = tx_receipt_info["tx_receipt"]
            except Exception as exc:
                logger.error(
                    f"backfill_missing_data_from_network.py | fetch_tx_receipts {tx} generated {exc}"
                )
    num_processed_txs = len(tx_receipts.keys())
    num_submitted_txs = len(txs)
    if num_processed_txs != num_submitted_txs:
        # error handling TODO
        logger.error("Error fetching missing tx receipts")
    return tx_receipts


# parse receipt and return array of missing objects for that receipt w/ IDs
def get_backfill_info(receipt):
    backfill_info = {"model": model}
    # contract_name = USER_FACTORY_CONTRACT_NAME # get_contract_name_for_tx(receipt) # TODO
    # event_type = get_event_type_for_tx(receipt) # TODO

    # # playlist - dependencies dont matter as much as track, user, ursm - actually maybe just do this in the backfill route - dependency graph of models. return an array of all the dependent objects in backfill
    # for id_key in get_id_keys(parsed_event): # TODO - maybe easier to just use emitted keys from receipt
    #     model = get_model_for_receipt(event_type, id_key)
    #         backfill_info.append({
    #         "model": model,
    #         "id_value": parsed_event[id_key]
    #     })
    # return backfill_info


# fetch receipts, parse and convert to array of missing objects - TODO whether to make missing object a struct or enum class?
def get_entities_from_skipped_tx(txs):
    tx_receipt_dict = fetch_missing_tx_receipts(txs)
    missing_entities = []
    for tx_hash, receipt in tx_receipt_dict.entries():
        missing_entities += get_backfill_info(receipt)


# confirm whether we have anything more recent for that object in
def missing_from_db(obj, session):
    model = obj.model
    missing_tx_blocknumber = obj.block_number
    existing_object = (
        session.query(model)
        .filter(model.blocknumber >= missing_tx_blocknumber, model.is_current == True)
        .first()
    )
    return False if existing_object else True


def get_backfill_data(obj):
    # concurrently query network for a given object
    # obj has model_type and other kv pairs for querying by rows
    # /full?model_type=model_name&id=id
    (all_dn_endpoints,) = get_all_other_nodes()
    BACKFILL_FROM_NETWORK_TIMEOUT = 5  # seconds
    CONSENSUS_NUMBER = math.floor(0.75 * len(all_dn_endpoints))
    BACKFILL_PATH = "full_data"

    model_version_count = {}
    for endpoint in all_dn_endpoints:
        query_uri = f"{endpoint}/{BACKFILL_PATH}"
        threads = []
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            threads.append(
                executor.submit(
                    helpers.get_request,
                    query_uri,
                    BACKFILL_FROM_NETWORK_TIMEOUT,
                    obj,  # no is_current here, but that's returned from the route side - everything but created_at and updated_at
                )
            )
            for future in concurrent.futures.as_completed(threads):
                model = future.result()
                try:
                    if model is not None:
                        model["model_type"] = obj["model_type"]
                        if model_version_count[model]:
                            model_version_count[model] += 1
                        else:
                            model_version_count[model] = 1
                except Exception as exc:
                    logger.error(
                        f"backfill_missing_data_from_network.py | backfill_data_from_network trying to retrieve {obj} from {query_uri} generated {exc}"
                    )
    consensus_model = next(
        (m for m in model_version_count.entries() if m[1] >= CONSENSUS_NUMBER), None
    )
    if consensus_model == None:
        logger.warning(
            f"backfill_missing_data_from_network.py | backfill_data_from_network trying to retrieve {obj} from network was unable to reach consensus."
        )
    return consensus_model


def backfill_data_from_network(
    missing_objects, session
):  # concurrently query for each missing obj
    retrieved_objects = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        retrieved_objects.append(
            executor.submit(get_backfill_data, o) for o in missing_objects
        )
        for future in concurrent.futures.as_completed(retrieved_objects):
            try:
                model_to_save = future.result()
                if model_to_save is not None:
                    model_type = model_to_save["model_type"]

            except Exception as exc:
                logger.error(
                    f"backfill_missing_data_from_network.py | backfill_data_from_network {tx} generated {exc}"
                )


def save_to_db(data_models, session):
    for model in data_models:
        session.add(model)


# ####### CELERY TASKS ####### #
@celery.task(name="backfill_missing_data_from_network", bind=True)
def backfill_task(self):
    # Cache custom task class properties
    # Details regarding custom task context can be found in wiki
    # Custom Task definition can be found in src/app.py
    db = backfill_task.db
    web3 = backfill_task.web3
    redis = backfill_task.redis

    # Define lock acquired boolean
    have_lock = False
    # Define redis lock object
    backfill_lock = redis.lock("backfill_lock", blocking_timeout=25)
    try:
        # Attempt to acquire lock - do not block if unable to acquire
        have_lock = backfill_lock.acquire(blocking=False)
        if have_lock:
            logger.info(
                f"index.py | {self.request.id} | backfill_task | Acquired backfill_lock"
            )

            with db.scoped_session() as session:
                transactions_to_backfill = get_skipped_transactions(session)
                entities_from_skipped_tx = get_entities_from_skipped_tx(
                    transactions_to_backfill
                )
                missing_objects = filter(
                    lambda object: missing_from_db(object, session),
                    entities_from_skipped_tx,
                )
                backfilled_data_models = backfill_data_from_network(
                    missing_objects, session
                )
                save_to_db(backfilled_data_models, session)
            logger.info(
                f"index.py | backfill_task | {self.request.id} | Processing complete within session"
            )
        else:
            logger.error(
                f"index.py | backfill_task | {self.request.id} | Failed to acquire backfill_lock"
            )
    except Exception as e:
        logger.error(f"Fatal error in main loop {e}", exc_info=True)
        raise e
    finally:
        if have_lock:
            backfill_lock.release()
