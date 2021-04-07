import binascii
import codecs
import logging
from datetime import datetime

import base58
from solana.rpc.api import Client
from src.models import Play
from src.tasks.celery_app import celery
from src.utils.redis_cache import get_pickled_key, pickle_and_set

# TODO: These are configs
AUDIUS_PROGRAM = "8vDMAyVt3mxEhsnzRQa5UEKX2STqv2JYeM2uGje5bcrJ"
SECP_PROGRAM = "KeccakSecp256k11111111111111111111111111111"
SLEEP_TIME = 1
SOLANA_ENDPOINT = "https://devnet.solana.com"

SOL_PLAYS_REDIS_KEY = "sol_plays"

http_client = Client(SOLANA_ENDPOINT)
logger = logging.getLogger(__name__)


# Actively connect to all peers in parallel
def process_solana_plays():
    redis = index_solana_plays.redis
    db = index_solana_plays.db
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
    if transaction["result"][0]["slot"] > slot_from:
        slot_from = transaction["result"][0]["slot"]
        pickle_and_set(redis, SOL_PLAYS_REDIS_KEY, slot_from)
        tx_info = http_client.get_confirmed_transaction(
            transaction["result"][0]["signature"]
        )
        if SECP_PROGRAM in tx_info["result"]["transaction"]["message"]["accountKeys"]:
            audius_program_index = tx_info["result"]["transaction"]["message"][
                "accountKeys"
            ].index(AUDIUS_PROGRAM)
            for instruction in tx_info["result"]["transaction"]["message"][
                "instructions"
            ]:
                if instruction["programIdIndex"] == audius_program_index:
                    hex_data = binascii.hexlify(
                        bytearray(list(base58.b58decode(instruction["data"])))
                    )

                    l1 = int(hex_data[2:4], 16)
                    start_data1 = 10
                    end_data1 = l1 * 2 + start_data1

                    l2 = int(hex_data[end_data1 : end_data1 + 2], 16)
                    start_data2 = end_data1 + 8
                    end_data2 = l2 * 2 + start_data2

                    l3 = int(hex_data[end_data2 : end_data2 + 2], 16)
                    start_data3 = end_data2 + 8
                    end_data3 = l3 * 2 + start_data3

                    user_id = codecs.decode(hex_data[start_data1:end_data1], 'hex')
                    track_id = codecs.decode(hex_data[start_data2:end_data2], 'hex')
                    source = codecs.decode(hex_data[start_data3:end_data3], 'hex')

                    logger.error("---------")
                    logger.error("---------")
                    logger.error(
                        f"Signed data:\nuser_id: {user_id}\ntrack_id: {track_id}\nsource: {source}"
                    )
                    logger.error(
                        f"Get 'send message' transaction: {tx_info['result']['transaction']['signatures'][0]}"
                    )
                    logger.error("---------")
                    logger.error("---------")
                    with db.scoped_session() as session:
                        session.add(Play(
                            user_id=int(user_id),
                            play_item_id=int(track_id),
                            source=str(source, 'utf-8')
                        ))
                    logger.error('COMMITTED PLAY')
                    logger.error("---------")

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
