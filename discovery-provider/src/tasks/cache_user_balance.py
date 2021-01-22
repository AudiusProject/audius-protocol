import logging
import time
from src import eth_abi_values
from src.tasks.celery_app import celery
from src.models import UserBalance, User
from src.queries.get_balances import does_user_balance_need_refresh, REDIS_PREFIX

logger = logging.getLogger(__name__)

audius_token_registry_key = bytes("Token", "utf-8")

def refresh_user_ids(redis, db, token_contract, eth_web3):
    # List users in Redis set
    redis_user_ids = redis.smembers(REDIS_PREFIX)
    # Convert the bytes to ints
    redis_user_ids = [user_id.decode() for user_id in redis_user_ids]

    if not redis_user_ids:
        return

    logger.info(f"cache_user_balance.py | Starting refresh with {len(redis_user_ids)} user_ids: {redis_user_ids}")

    with db.scoped_session() as session:
        query = ((
            session.query(UserBalance)
        ).filter(
            UserBalance.user_id.in_(redis_user_ids)
        ).all())

        # Filter only user_balances that still need refresh
        needs_refresh = list(filter(does_user_balance_need_refresh, query))

        # map user_id -> user_balance
        needs_refresh_map = {user.user_id: user for user in needs_refresh}

        # Grab the users we need to refresh
        user_query = ((
            session.query(User)
        ).filter(
            User.user_id.in_(needs_refresh_map.keys()),
            User.is_current == True,
        )).all()

        logger.info(f"cache_user_balance.py | fetching for {len(user_query)} users: {needs_refresh_map.keys()}")

        # Fetch balances
        for user in user_query:
            wallet, user_id = user.wallet, user.user_id
            wallet = eth_web3.toChecksumAddress(wallet)

            # get balance
            balance = token_contract.functions.balanceOf(wallet).call()

            # update the balance on the user model
            user_balance = needs_refresh_map[user_id]
            user_balance.balance = balance

        # Commit the new balances
        session.commit()

        # Remove the fetched balances from Redis set
        logger.info(f"cache_user_balance.py | Got balances for {len(user_query)} users, removing from Redis.")
        redis.srem(REDIS_PREFIX, *redis_user_ids)

def get_token_contract(eth_web3, shared_config):
    eth_registry_address = eth_web3.toChecksumAddress(
        shared_config["eth_contracts"]["registry"]
    )

    eth_registry_instance = eth_web3.eth.contract(
        address=eth_registry_address, abi=eth_abi_values["Registry"]["abi"]
    )

    token_address = eth_registry_instance.functions.getContract(
        audius_token_registry_key
    ).call()

    audius_token_instance = eth_web3.eth.contract(
        address=token_address, abi=eth_abi_values["AudiusToken"]["abi"]
    )

    return audius_token_instance


@celery.task(name="update_user_balances", bind=True)
def update_user_balances_task(self):
    """Caches user Audio balances, in wei."""

    db = update_user_balances_task.db
    redis = update_user_balances_task.redis
    eth_web3 = update_user_balances_task.eth_web3
    shared_config = update_user_balances_task.shared_config

    have_lock = False
    update_lock = redis.lock("update_user_balances_lock", timeout=7200)

    try:
        have_lock = update_lock.acquire(blocking=False)

        if have_lock:
            start_time = time.time()

            token_inst = get_token_contract(eth_web3, shared_config)
            refresh_user_ids(redis, db, token_inst, eth_web3)

            end_time = time.time()
            logger.info(f"cache_user_balance.py | Finished cache_user_balance in {end_time - start_time} seconds")
        else:
            logger.info("cache_user_balance.py | Failed to acquire lock")
    except Exception as e:
        logger.error("cache_user_balance.py | Fatal error in main loop", exc_info=True)
        raise e
    finally:
        if have_lock:
            update_lock.release()
