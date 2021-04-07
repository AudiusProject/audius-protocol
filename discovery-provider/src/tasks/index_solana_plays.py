import logging

from solana.rpc.api import Client
from src.tasks.celery_app import celery
from src.utils.redis_cache import get_pickled_key, pickle_and_set

# TODO: These are configs
AUDIUS_PROGRAM = "BnmzQSTFwNh9S1abdAAKJo5dELbZSWhqfgH116BqkJPJ"
SECP_PROGRAM = "KeccakSecp256k11111111111111111111111111111"
SLEEP_TIME = 1
SOLANA_ENDPOINT = "https://devnet.solana.com"

SOL_PLAYS_REDIS_KEY = "sol_plays"

http_client = Client(SOLANA_ENDPOINT)
logger = logging.getLogger(__name__)


# Actively connect to all peers in parallel
def process_solana_plays():
    redis = index_solana_plays.redis
    logger.error("\n\n")
    logger.error("")
    logger.error("Processing plays...")

    # TODO: Place slot_from in redis and process from that if not found, then set the first time
    slot_from = get_pickled_key(redis, SOL_PLAYS_REDIS_KEY)

    logger.error(f"Found slot_from={slot_from} in REDIS")
    if not slot_from:
        slot_from = http_client.get_slot()["result"]
        logger.error(f"Setting slot from to {slot_from}")
        pickle_and_set(redis, SOL_PLAYS_REDIS_KEY, slot_from)

    # slot_from = http_client.get_slot()["result"]
    transaction = http_client.get_confirmed_signature_for_address2(
        AUDIUS_PROGRAM, limit=1
    )
    # TODO: RECORD PLAY DATA
    logger.error(transaction)
    logger.error("")
    logger.error("\n\n")


######## CELERY TASKS ########
@celery.task(name="index_solana_plays", bind=True)
def index_solana_plays(self):
    # Cache custom task class properties
    # Details regarding custom task context can be found in wiki
    # Custom Task definition can be found in src/__init__.py
    redis = index_solana_plays.redis
    # Define lock acquired boolean
    have_lock = False
    # Define redis lock object
    update_lock = redis.lock("solana_plays_lock", timeout=7200)
    try:
        # Attempt to acquire lock - do not block if unable to acquire
        have_lock = update_lock.acquire(blocking=False)
        if have_lock:
            process_solana_plays()
        else:
            logger.info("index_solana_plays.py | Failed to acquire index_solana_plays")
    except Exception as e:
        logger.error("index_solana_plays.py | Fatal error in main loop", exc_info=True)
        raise e
    finally:
        if have_lock:
            update_lock.release()
