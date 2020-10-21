import logging
import requests
from urllib.parse import urljoin

from src import contract_addresses
from src.models import Block, User, Track, Repost, Follow, Playlist, Save
from src.tasks.celery_app import celery
from src.tasks.tracks import track_state_update
from src.tasks.users import user_state_update  # pylint: disable=E0611,E0001
from src.tasks.social_features import social_feature_state_update
from src.tasks.playlists import playlist_state_update
from src.tasks.user_library import user_library_state_update
from src.utils.helpers import get_ipfs_info_from_cnode_endpoint
from src.utils.redis_constants import latest_block_redis_key, \
    latest_block_hash_redis_key, most_recent_indexed_block_hash_redis_key, \
    most_recent_indexed_block_redis_key
from src.utils.redis_cache import remove_cached_user_ids, \
    remove_cached_track_ids, remove_cached_playlist_ids

logger = logging.getLogger(__name__)


######## HELPER FUNCTIONS ########

default_padded_start_hash = (
    "0x0000000000000000000000000000000000000000000000000000000000000000"
)
default_config_start_hash = "0x0"

def get_contract_info_if_exists(self, address):
    for contract_name, contract_address in contract_addresses.items():
        if update_task.web3.toChecksumAddress(contract_address) == address:
            return (contract_name, contract_address)
    return None

def initialize_blocks_table_if_necessary(db):
    redis = update_task.redis

    target_blockhash = None
    target_blockhash = update_task.shared_config["discprov"]["start_block"]
    target_block = update_task.web3.eth.getBlock(target_blockhash, True)

    with db.scoped_session() as session:
        current_block_query_result = session.query(Block).filter_by(is_current=True)
        if current_block_query_result.count() == 0:
            blocks_query_result = session.query(Block)
            assert (
                blocks_query_result.count() == 0
            ), "Corrupted DB State - Expect single row marked as current"
            block_model = Block(
                blockhash=target_blockhash,
                number=target_block.number,
                parenthash=target_blockhash,
                is_current=True,
            )
            if target_block.number == 0:
                block_model.number = None

            session.add(block_model)
            logger.info(f"index.py | initialize_blocks_table_if_necessary | Initializing blocks table - {block_model}")
        else:
            assert (
                current_block_query_result.count() == 1
            ), "Expected SINGLE row marked as current"

            # set the last indexed block in redis
            current_block_result = current_block_query_result.first()
            if current_block_result.number:
                redis.set(most_recent_indexed_block_redis_key, current_block_result.number)
            if current_block_result.blockhash:
                redis.set(most_recent_indexed_block_hash_redis_key, current_block_result.blockhash)

    return target_blockhash

def get_latest_block(db):
    latest_block = None
    block_processing_window = int(update_task.shared_config["discprov"]["block_processing_window"])
    with db.scoped_session() as session:
        current_block_query = session.query(Block).filter_by(is_current=True)
        assert (
            current_block_query.count() == 1
        ), "Expected SINGLE row marked as current"

        current_block_query_results = current_block_query.all()
        current_block = current_block_query_results[0]
        current_block_number = current_block.number

        if current_block_number == None:
            current_block_number = 0

        target_latest_block_number = current_block_number + block_processing_window

        latest_block_from_chain = update_task.web3.eth.getBlock('latest', True)
        latest_block_number_from_chain = latest_block_from_chain.number

        if target_latest_block_number > latest_block_number_from_chain:
            target_latest_block_number = latest_block_number_from_chain

        logger.info(f"index.py | get_latest_block | current={current_block_number} target={target_latest_block_number}")
        latest_block = update_task.web3.eth.getBlock(target_latest_block_number, True)
    return latest_block

def update_latest_block_redis():
    latest_block_from_chain = update_task.web3.eth.getBlock('latest', True)
    redis = update_task.redis
    redis.set(latest_block_redis_key, latest_block_from_chain.number)
    redis.set(latest_block_hash_redis_key, latest_block_from_chain.hash.hex())

def index_blocks(self, db, blocks_list):
    web3 = update_task.web3
    redis = update_task.redis

    num_blocks = len(blocks_list)
    block_order_range = range(len(blocks_list) - 1, -1, -1)
    for i in block_order_range:
        block = blocks_list[i]
        block_index = num_blocks - i
        block_number = block.number
        block_timestamp = block.timestamp
        logger.info(
            f"index.py | index_blocks | {self.request.id} | block {block.number} - {block_index}/{num_blocks}"
        )

        # Handle each block in a distinct transaction
        with db.scoped_session() as session:
            current_block_query = session.query(Block).filter_by(is_current=True)

            # Without this check we may end up duplicating an insert operation
            block_model = Block(
                blockhash=web3.toHex(block.hash),
                parenthash=web3.toHex(block.parentHash),
                number=block.number,
                is_current=True,
            )

            # Update blocks table after
            assert (
                current_block_query.count() == 1
            ), "Expected single row marked as current"

            former_current_block = current_block_query.first()
            former_current_block.is_current = False
            session.add(block_model)

            user_factory_txs = []
            track_factory_txs = []
            social_feature_factory_txs = []
            playlist_factory_txs = []
            user_library_factory_txs = []

            # Sort transactions by hash
            sorted_txs = sorted(block.transactions, key=lambda entry: entry['hash'])

            # Parse tx events in each block
            for tx in sorted_txs:
                tx_hash = web3.toHex(tx["hash"])
                tx_target_contract_address = tx["to"]
                tx_receipt = web3.eth.getTransactionReceipt(tx_hash)

                # Handle user operations
                if tx_target_contract_address == contract_addresses["user_factory"]:
                    logger.info(
                        f"index.py | index_blocks | UserFactory contract addr: {tx_target_contract_address}"
                        f" tx from block - {tx}, receipt - {tx_receipt}, adding to user_factory_txs to process in bulk"
                    )
                    user_factory_txs.append(tx_receipt)

                # Handle track operations
                if tx_target_contract_address == contract_addresses["track_factory"]:
                    logger.info(
                        f"index.py | index_blocks | TrackFactory contract addr: {tx_target_contract_address}"
                        f" tx from block - {tx}, receipt - {tx_receipt}"
                    )
                    # Track state operations
                    track_factory_txs.append(tx_receipt)

                # Handle social operations
                if tx_target_contract_address == contract_addresses["social_feature_factory"]:
                    logger.info(
                        f"index.py | index_blocks | Social feature contract addr: {tx_target_contract_address}"
                        f"tx from block - {tx}, receipt - {tx_receipt}"
                    )
                    social_feature_factory_txs.append(tx_receipt)

                # Handle repost operations
                if tx_target_contract_address == contract_addresses["playlist_factory"]:
                    logger.info(
                        f"index.py | index_blocks | Playlist contract addr: {tx_target_contract_address}"
                        f"tx from block - {tx}, receipt - {tx_receipt}"
                    )
                    playlist_factory_txs.append(tx_receipt)

                # Handle User Library operations
                if tx_target_contract_address == contract_addresses["user_library_factory"]:
                    logger.info(
                        f"index.py | index_blocks | User Library contract addr: {tx_target_contract_address}"
                        f"tx from block - {tx}, receipt - {tx_receipt}"
                    )
                    user_library_factory_txs.append(tx_receipt)

            # bulk process operations once all tx's for block have been parsed
            total_user_changes, user_ids = user_state_update(
                self, update_task, session, user_factory_txs, block_number, block_timestamp)
            user_state_changed = total_user_changes > 0

            total_track_changes, track_ids = track_state_update(
                self, update_task, session, track_factory_txs, block_number, block_timestamp
            )
            track_state_changed = total_track_changes > 0

            social_feature_state_changed = ( # pylint: disable=W0612
                social_feature_state_update(
                    self, update_task, session, social_feature_factory_txs, block_number, block_timestamp
                )
                > 0
            )

            # Playlist state operations processed in bulk
            total_playlist_changes, playlist_ids = playlist_state_update(
                self, update_task, session, playlist_factory_txs, block_number, block_timestamp
            )
            playlist_state_changed = total_playlist_changes > 0

            user_library_state_changed = user_library_state_update( # pylint: disable=W0612
                self, update_task, session, user_library_factory_txs, block_number, block_timestamp
            )

            # keep search materialized view in sync with db
            # only refresh track_lexeme_dict when necessary
            # social state changes are not factored in since they don't affect track_lexeme_dict
            # write out all pending transactions to db before refreshing view
            track_lexeme_state_changed = (user_state_changed or track_state_changed)
            session.flush()
            if user_state_changed:
                session.execute("REFRESH MATERIALIZED VIEW user_lexeme_dict")
                if user_ids:
                    remove_cached_user_ids(redis, user_ids)
            if track_lexeme_state_changed:
                if track_ids:
                    remove_cached_track_ids(redis, track_ids)
                session.execute("REFRESH MATERIALIZED VIEW track_lexeme_dict")
            if playlist_state_changed:
                session.execute("REFRESH MATERIALIZED VIEW playlist_lexeme_dict")
                session.execute("REFRESH MATERIALIZED VIEW album_lexeme_dict")
                if playlist_ids:
                    remove_cached_playlist_ids(redis, playlist_ids)

        # add the block number of the most recently processed block to redis
        redis.set(most_recent_indexed_block_redis_key, block.number)
        redis.set(most_recent_indexed_block_hash_redis_key, block.hash.hex())

    if num_blocks > 0:
        logger.warning(f"index.py | index_blocks | Indexed {num_blocks} blocks")

# transactions are reverted in reverse dependency order (social features --> playlists --> tracks --> users)
def revert_blocks(self, db, revert_blocks_list):
    # TODO: Remove this exception once the unexpected revert scenario has been diagnosed
    num_revert_blocks = len(revert_blocks_list)
    if num_revert_blocks == 0:
        return

    if num_revert_blocks > 500:
        logger.error(f"index.py | {self.request.id} | Revert blocks list > 500:")
        logger.error(revert_blocks_list)
        raise Exception('Unexpected revert, >0 blocks')

    logger.error(f"index.py | {self.request.id} | Reverting {num_revert_blocks} blocks")
    logger.error(revert_blocks_list)

    with db.scoped_session() as session:

        rebuild_playlist_index = False
        rebuild_track_index = False
        rebuild_user_index = False

        for revert_block in revert_blocks_list:
            # Cache relevant information about current block
            revert_hash = revert_block.blockhash
            revert_block_number = revert_block.number
            logger.info(f"Reverting {revert_block_number}")
            parent_hash = revert_block.parenthash

            # Special case for default start block value of 0x0 / 0x0...0
            if revert_block.parenthash == default_padded_start_hash:
                parent_hash = default_config_start_hash

            # Update newly current block row and outdated row (indicated by current block's parent hash)
            session.query(Block).filter(Block.blockhash == revert_hash).update(
                {"is_current": False}
            )
            session.query(Block).filter(Block.blockhash == parent_hash).update(
                {"is_current": True}
            )

            # aggregate all transactions in current block
            revert_save_entries = (
                session.query(Save).filter(Save.blockhash == revert_hash).all()
            )
            revert_repost_entries = (
                session.query(Repost).filter(Repost.blockhash == revert_hash).all()
            )
            revert_follow_entries = (
                session.query(Follow).filter(Follow.blockhash == revert_hash).all()
            )
            revert_playlist_entries = (
                session.query(Playlist).filter(Playlist.blockhash == revert_hash).all()
            )
            revert_track_entries = (
                session.query(Track).filter(Track.blockhash == revert_hash).all()
            )
            revert_user_entries = (
                session.query(User).filter(User.blockhash == revert_hash).all()
            )

            # revert all of above transactions

            for save_to_revert in revert_save_entries:
                save_item_id = save_to_revert.save_item_id
                save_user_id = save_to_revert.user_id
                save_type = save_to_revert.save_type
                previous_save_entry = (
                    session.query(Save)
                    .filter(Save.user_id == save_user_id)
                    .filter(Save.save_item_id == save_item_id)
                    .filter(Save.save_type == save_type)
                    .order_by(Save.blocknumber.desc())
                    .first()
                )
                if previous_save_entry:
                    previous_save_entry.is_current = True
                # Remove outdated save item entry
                session.delete(save_to_revert)

            for repost_to_revert in revert_repost_entries:
                repost_user_id = repost_to_revert.user_id
                repost_item_id = repost_to_revert.repost_item_id
                repost_type = repost_to_revert.repost_type
                previous_repost_entry = (
                    session.query(Repost)
                    .filter(Repost.user_id == repost_user_id)
                    .filter(Repost.repost_item_id == repost_item_id)
                    .filter(Repost.repost_type == repost_type)
                    .order_by(Repost.blocknumber.desc())
                    .first()
                )
                # Update prev repost row (is_delete) to is_current == True
                if previous_repost_entry:
                    previous_repost_entry.is_current = True
                # Remove outdated repost entry
                logger.info(f"Reverting repost: {repost_to_revert}")
                session.delete(repost_to_revert)

            for follow_to_revert in revert_follow_entries:
                previous_follow_entry = (
                    session.query(Follow)
                    .filter(Follow.follower_user_id == follow_to_revert.follower_user_id)
                    .filter(Follow.followee_user_id == follow_to_revert.followee_user_id)
                    .order_by(Follow.blocknumber.desc())
                    .first()
                )
                # update prev follow row (is_delete) to is_current = true
                if previous_follow_entry:
                    previous_follow_entry.is_current = True
                # remove outdated follow entry
                logger.info(f"Reverting follow: {follow_to_revert}")
                session.delete(follow_to_revert)

            for playlist_to_revert in revert_playlist_entries:
                playlist_id = playlist_to_revert.playlist_id
                previous_playlist_entry = (
                    session.query(Playlist)
                    .filter(Playlist.playlist_id == playlist_id)
                    .filter(Playlist.blocknumber < revert_block_number)
                    .order_by(Playlist.blocknumber.desc())
                    .first()
                )
                if previous_playlist_entry:
                    previous_playlist_entry.is_current = True
                # Remove outdated playlist entry
                session.delete(playlist_to_revert)

            for track_to_revert in revert_track_entries:
                track_id = track_to_revert.track_id
                previous_track_entry = (
                    session.query(Track)
                    .filter(Track.track_id == track_id)
                    .filter(Track.blocknumber < revert_block_number)
                    .order_by(Track.blocknumber.desc())
                    .first()
                )
                if previous_track_entry:
                    # First element in descending order is new current track item
                    previous_track_entry.is_current = True
                # Remove track entries
                logger.info(f"Reverting track: {track_to_revert}")
                session.delete(track_to_revert)

            # TODO: ASSERT ON IDS GREATER FOR BOTH DATA MODELS
            for user_to_revert in revert_user_entries:
                user_id = user_to_revert.user_id
                previous_user_entry = (
                    session.query(User)
                    .filter(User.user_id == user_id)
                    .filter(User.blocknumber < revert_block_number)
                    .order_by(User.blocknumber.desc())
                    .first()
                )
                if previous_user_entry:
                    # Update previous user row, setting is_current to true
                    previous_user_entry.is_current = True
                # Remove outdated user entries
                logger.info(f"Reverting user: {user_to_revert}")
                session.delete(user_to_revert)

            # Remove outdated block entry
            session.query(Block).filter(Block.blockhash == revert_hash).delete()

            rebuild_playlist_index = rebuild_playlist_index or bool(revert_playlist_entries)
            rebuild_track_index = rebuild_track_index or bool(revert_track_entries)
            rebuild_user_index = rebuild_user_index or bool(revert_user_entries)

        if rebuild_playlist_index:
            session.execute("REFRESH MATERIALIZED VIEW playlist_lexeme_dict")
            session.execute("REFRESH MATERIALIZED VIEW album_lexeme_dict")
        if rebuild_user_index or rebuild_track_index:
            session.execute("REFRESH MATERIALIZED VIEW track_lexeme_dict")
        if rebuild_user_index:
            session.execute("REFRESH MATERIALIZED VIEW user_lexeme_dict")

    # TODO - if we enable revert, need to set the most_recent_indexed_block_redis_key key in redis


######## IPFS PEER REFRESH ########
def refresh_peer_connections(task_context):
    db = task_context.db
    ipfs_client = task_context.ipfs_client
    redis = task_context.redis
    interval = int(task_context.shared_config["discprov"]["peer_refresh_interval"])
    with db.scoped_session() as session:
        db_cnode_endpts = (
            session.query(
                User.creator_node_endpoint).filter(
                    User.creator_node_endpoint != None, User.is_current == True
                ).distinct()
        )

        cnode_endpoints = {}
        # Generate dictionary of unique creator node endpoints
        for entry in db_cnode_endpts:
            for cnode_user_set in entry:
                cnode_entries = cnode_user_set.split(',')
                for cnode_url in cnode_entries:
                    if cnode_url == "''":
                        continue
                    cnode_endpoints[cnode_url] = True

        # Add user metadata URL to peer connection list
        user_node_url = task_context.shared_config["discprov"]["user_metadata_service_url"]
        cnode_endpoints[user_node_url] = True

        # fetch all creator nodes registered on chain
        # TODO cache locally and refresh intermittently
        try:
          identity_url = task_context.shared_config['discprov']['identity_service_url']
          identity_endpoint = urljoin(identity_url, 'registered_creator_nodes')

          r = requests.get(identity_endpoint, timeout=3)
          if r.status_code != 200:
            raise Exception(f"Query to identity_endpoint failed with status code {r.status_code}")

          registered_cnodes = r.json()

          for node_info in registered_cnodes:
            cnode_endpoints[node_info['endpoint']] = True
        except Exception as e:
          logger.error(f"Identity fetch failed {e}")

        # Update creator node list
        ipfs_client.update_cnode_urls(list(cnode_endpoints.keys()))

        # Query ipfs information for each cnode endpoint
        multiaddr_info = {}
        for cnode_url in cnode_endpoints:
            stored_in_redis = redis.get(cnode_url)
            if stored_in_redis is not None:
                continue
            if cnode_url == "''":
                continue

            try:
                logger.warning('index.py | Retrieving connection info for %s', cnode_url)
                multiaddr_info[cnode_url] = get_ipfs_info_from_cnode_endpoint(
                    cnode_url,
                    None
                )
            except Exception as e:  # pylint: disable=broad-except
                # Handle error in retrieval by not peering this node
                logger.warning('index.py | Error retrieving info for %s, %s', cnode_url, str(e))
                multiaddr_info[cnode_url] = None

        for key in multiaddr_info:
            if multiaddr_info[key] is not None:
                try:
                # Peer nodes
                    logger.warning('index.py | Connecting to %s', multiaddr_info[key])
                    ipfs_client.connect_peer(multiaddr_info[key])
                    redis.set(key, multiaddr_info[key], ex=interval)
                except Exception as e: #pylint: disable=broad-except
                    logger.warning('index.py | Error connection to %s, %s, %s', multiaddr_info[key], cnode_url, str(e))


######## CELERY TASKS ########
@celery.task(name="update_discovery_provider", bind=True)
def update_task(self):
    # Cache custom task class properties
    # Details regarding custom task context can be found in wiki
    # Custom Task definition can be found in src/__init__.py
    db = update_task.db
    web3 = update_task.web3
    redis = update_task.redis

    # Update redis cache for health check queries
    update_latest_block_redis()

    # Define lock acquired boolean
    have_lock = False
    # Define redis lock object
    update_lock = redis.lock("disc_prov_lock", blocking_timeout=25)
    try:
        # Attempt to acquire lock - do not block if unable to acquire
        have_lock = update_lock.acquire(blocking=False)
        if have_lock:
            # Refresh all IPFS peer connections
            refresh_peer_connections(self)

            logger.info(f"index.py | {self.request.id} | update_task | Acquired disc_prov_lock")
            initialize_blocks_table_if_necessary(db)

            latest_block = get_latest_block(db)

            # Capture block information between latest and target block hash
            index_blocks_list = []

            # Capture outdated block information given current database state
            revert_blocks_list = []

            with db.scoped_session() as session:
                block_intersection_found = False
                intersect_block_hash = web3.toHex(latest_block.hash)

                # First, we capture the block hash at which the current tail
                # and our indexed data intersect
                while not block_intersection_found:
                    current_hash = web3.toHex(latest_block.hash)
                    parent_hash = web3.toHex(latest_block.parentHash)

                    latest_block_db_query = session.query(Block).filter(
                        Block.blockhash == current_hash
                        and Block.parenthash == parent_hash
                        and Block.is_current == True
                    )

                    # Exit loop if we are up to date
                    if latest_block_db_query.count() > 0:
                        block_intersection_found = True
                        intersect_block_hash = current_hash
                        continue

                    index_blocks_list.append(latest_block)

                    parent_block_query = session.query(Block).filter(
                        Block.blockhash == parent_hash
                    )

                    # Intersection is considered found if current block parenthash is
                    # present in Blocks table
                    block_intersection_found = parent_block_query.count() > 0

                    num_blocks = len(index_blocks_list)
                    if num_blocks % 50 == 0:
                        logger.info(
                            f"index.py | update_task | Populating index_blocks_list, current length == {num_blocks}"
                        )

                    # Special case for initial block hash value of 0x0 and 0x0000....
                    reached_initial_block = parent_hash == default_padded_start_hash
                    if reached_initial_block:
                        block_intersection_found = True
                        intersect_block_hash = default_config_start_hash
                    else:
                        latest_block = web3.eth.getBlock(parent_hash, True)
                        intersect_block_hash = web3.toHex(latest_block.hash)

                # Determine whether current indexed data (is_current == True) matches the
                # intersection block hash
                # Important when determining whether undo operations are necessary
                base_query = session.query(Block)
                base_query = base_query.filter(Block.is_current == True)
                db_block_query = base_query.all()

                assert len(db_block_query) == 1, "Expected SINGLE row marked as current"
                db_current_block = db_block_query[0]

                # Check current block
                undo_operations_required = (
                    db_current_block.blockhash != intersect_block_hash
                )

                if undo_operations_required:
                    logger.info(
                        f"index.py | update_task | Undo required - {undo_operations_required}. \
                                Intersect_blockhash : {intersect_block_hash}.\
                                DB current blockhash {db_current_block.blockhash}"
                    )
                else:
                    logger.info(
                        f"index.py | update_task | Intersect_blockhash : {intersect_block_hash}"
                    )

                # Assign traverse block to current database block
                traverse_block = db_current_block

                # Add blocks to 'block remove' list from here as we traverse to the
                # valid intersect block
                while traverse_block.blockhash != intersect_block_hash:
                    revert_blocks_list.append(traverse_block)
                    parent_query = session.query(Block).filter(
                        Block.blockhash == traverse_block.parenthash
                    )

                    if parent_query.count() == 0:
                        logger.info(
                            f"index.py | update_task | Special case exit traverse block parenthash - "
                            f"{traverse_block.parenthash}"
                        )
                        break
                    traverse_block = parent_query[0]

                # Ensure revert blocks list is available after session scope
                session.expunge_all()

            # Exit DB scope, revert/index functions will manage their own sessions
            # Perform revert operations
            revert_blocks(self, db, revert_blocks_list)

            # Perform indexing operations
            index_blocks(self, db, index_blocks_list)
            logger.info(f"index.py | update_task | {self.request.id} | Processing complete within session")
        else:
            logger.error(f"index.py | update_task | {self.request.id} | Failed to acquire disc_prov_lock")
    except Exception as e:
        logger.error(f"Fatal error in main loop {e}", exc_info=True)
        raise e
    finally:
        if have_lock:
            update_lock.release()
