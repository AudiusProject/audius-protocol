import logging
import os
import sqlalchemy

from src.models import Block, BlacklistedIPLD
from src.utils import helpers, redis_connection, web3_provider, db_session
from src.utils.config import shared_config
from src.utils.redis_constants import latest_block_redis_key, \
    latest_block_hash_redis_key, most_recent_indexed_block_hash_redis_key, most_recent_indexed_block_redis_key, \
    most_recent_indexed_ipld_block_redis_key, most_recent_indexed_ipld_block_hash_redis_key


logger = logging.getLogger(__name__)
disc_prov_version = helpers.get_discovery_provider_version()

default_healthy_block_diff = int(
    shared_config["discprov"]["healthy_block_diff"])

# Returns DB block state & diff
def _get_db_block_state():
    db = db_session.get_db_read_replica()
    with db.scoped_session() as session:
        # Fetch latest block from DB
        db_block_query = session.query(Block).filter(
            Block.is_current == True).all()
        assert len(db_block_query) == 1, "Expected SINGLE row marked as current"
        return helpers.model_to_dictionary(db_block_query[0])

# Returns number of and info on open db connections
def _get_db_conn_state():
    db = db_session.get_db_read_replica()
    with db.scoped_session() as session:
        # Query number of open DB connections
        num_connections = session.execute(
            sqlalchemy.text("select sum(numbackends) from pg_stat_database;")
        ).fetchall()

        if not (num_connections and num_connections[0][0]):
            return 'pg_stat_database query failed', True
        num_connections = num_connections[0][0]

        # Query connection info
        connection_info = session.execute(sqlalchemy.text(
            "select datname, state, query, wait_event_type, wait_event from pg_stat_activity where state is not null;"
        )).fetchall()
        connection_info = [dict(row) for row in connection_info]

    return {"open_connections": num_connections, "connection_info": connection_info}, False

# Returns the max block number in ipld blacklist table and the associated block hash
def _get_db_ipld_block_state():
    ipld_block_number = 0
    ipld_block_hash = ''

    db = db_session.get_db_read_replica()
    with db.scoped_session() as session:
        # Fetch the row with the largest indexed block number
        db_ipld_block_max = session.query(sqlalchemy.func.max(BlacklistedIPLD.blocknumber)).scalar()
        # If a number is found, return the block number and its hash
        if db_ipld_block_max is not None:
            db_ipld_block_row = session.query(BlacklistedIPLD).filter(
                BlacklistedIPLD.blocknumber == db_ipld_block_max
            ).one()
            ipld_block_number = db_ipld_block_row.blocknumber
            ipld_block_hash = db_ipld_block_row.blockhash


    return ipld_block_number, ipld_block_hash
# Get the max blocknumber indexed in ipld blacklist table. Uses redis cache by default.
def get_latest_ipld_indexed_block(use_redis_cache=True):
    redis = redis_connection.get_redis()
    latest_indexed_ipld_block_num = None
    latest_indexed_ipld_block_hash = None

    if use_redis_cache:
        latest_indexed_ipld_block_num = redis.get(
            most_recent_indexed_ipld_block_redis_key
        )
        latest_indexed_ipld_block_hash = redis.get(
            most_recent_indexed_ipld_block_hash_redis_key
        )
        if latest_indexed_ipld_block_num is not None:
            latest_indexed_ipld_block_num = int(latest_indexed_ipld_block_num)

    if latest_indexed_ipld_block_num is None or latest_indexed_ipld_block_hash is None:
        latest_indexed_ipld_block_num, latest_indexed_ipld_block_hash = _get_db_ipld_block_state()

        # If there are no entries in the table, default to these values
        if latest_indexed_ipld_block_num is None:
            latest_indexed_ipld_block_num = 0
        if latest_indexed_ipld_block_hash is None:
            latest_indexed_ipld_block_hash = ''

        redis.set(most_recent_indexed_ipld_block_redis_key, latest_indexed_ipld_block_num)
        redis.set(most_recent_indexed_ipld_block_hash_redis_key, latest_indexed_ipld_block_hash)

    return latest_indexed_ipld_block_num, latest_indexed_ipld_block_hash


def get_health(args, use_redis_cache=True):
    """
    Gets health status for the service

    :param args: dictionary
    :param args.verbose: bool
        if True, returns db connection information
    :param args.healthy_block_diff: int
        determines the point at which a block difference is considered unhealthy
    :param args.enforce_block_diff: bool
        if true and the block difference is unhealthy an error is returned

    :rtype: (dictionary, bool)
    :return: tuple of health results and a boolean indicating an error
    """
    redis = redis_connection.get_redis()
    web3 = web3_provider.get_web3()

    verbose = args.get("verbose")
    enforce_block_diff = args.get("enforce_block_diff")
    qs_healthy_block_diff = args.get("healthy_block_diff")

    # If healthy block diff is given in url and positive, override config value
    healthy_block_diff = qs_healthy_block_diff if qs_healthy_block_diff is not None \
        and qs_healthy_block_diff >= 0 else default_healthy_block_diff

    latest_block_num = None
    latest_block_hash = None

    # Get latest web block info
    if use_redis_cache:
        stored_latest_block_num = redis.get(latest_block_redis_key)
        if stored_latest_block_num is not None:
            latest_block_num = int(stored_latest_block_num)

        stored_latest_blockhash = redis.get(latest_block_hash_redis_key)
        if stored_latest_blockhash is not None:
            latest_block_hash = stored_latest_blockhash.decode("utf-8")

    if latest_block_num is None or latest_block_hash is None:
        latest_block = web3.eth.getBlock("latest", True)
        latest_block_num = latest_block.number
        latest_block_hash = latest_block.hash.hex()

    latest_indexed_block_num = None
    latest_indexed_block_hash = None

    # Get latest indexed block info
    if use_redis_cache:
        latest_indexed_block_num = redis.get(
            most_recent_indexed_block_redis_key)
        if latest_indexed_block_num is not None:
            latest_indexed_block_num = int(latest_indexed_block_num)

        latest_indexed_block_hash = redis.get(
            most_recent_indexed_block_hash_redis_key)
        if latest_indexed_block_hash is not None:
            latest_indexed_block_hash = latest_indexed_block_hash.decode(
                "utf-8")

    if latest_indexed_block_num is None or latest_indexed_block_hash is None:
        db_block_state = _get_db_block_state()
        latest_indexed_block_num = db_block_state["number"] or 0
        latest_indexed_block_hash = db_block_state["blockhash"]

    health_results = {
        "web": {
            "blocknumber": latest_block_num,
            "blockhash": latest_block_hash,
        },
        "db": {
            "number": latest_indexed_block_num,
            "blockhash": latest_indexed_block_hash
        },
        "git": os.getenv("GIT_SHA"),
    }

    block_difference = abs(
        health_results["web"]["blocknumber"] - health_results["db"]["number"]
    )
    health_results["block_difference"] = block_difference
    health_results["maximum_healthy_block_difference"] = default_healthy_block_diff
    health_results.update(disc_prov_version)

    if verbose:
        # DB connections check
        db_connections_json, error = _get_db_conn_state()
        health_results["db_connections"] = db_connections_json
        if error:
            return health_results, error

    # Return error on unhealthy block diff if requested.
    if enforce_block_diff and health_results["block_difference"] > healthy_block_diff:
        return health_results, True

    return health_results, False
