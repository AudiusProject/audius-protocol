import logging
import re

from src.tasks.celery_app import celery
from src.utils.config import shared_config
from src.utils.solana import get_address_pair
from src.models import User

from solana.publickey import PublicKey

logger = logging.getLogger(__name__)

USER_BANK_ADDRESS = shared_config["solana"]["user_bank_program_address"]
USER_BANK_KEY = PublicKey(USER_BANK_ADDRESS)
WAUDIO_PROGRAM_ID = PublicKey("CYzPVv1zB9RH6hRWRKprFoepdD8Y7Q5HefCqrybvetja")
SPL_TOKEN_ID = PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA")
MIN_SLOT = 84150237

def parse_eth_address_from_msg(msg):
    logger.error(f"index_user_bank.py {msg}")
    res = re.findall(r'\[.*?\]', msg)
    # Remove brackets
    inner_res = res[0][1:-1]
    # Convert to public key hex for ethereum
    arr_val = [int(s) for s in inner_res.split(',')]
    public_key_bytes = bytes(arr_val)
    public_key = public_key_bytes.hex()
    public_key_str = f"0x{public_key}"
    return public_key_str, public_key_bytes

def get_known_user(eth_address, db):
    with db.scoped_session() as session:
        logger.info(f"index_user_bank.py | Searching for user {eth_address}")
        existing_user_query = (
            session.query(User)
            .filter(User.is_current == True)
            .filter(User.wallet == eth_address)
        ).first()
        logger.info(f"index_user_bank.py | Found user {existing_user_query}")

######## CELERY TASKS ########
@celery.task(name="index_user_bank", bind=True)
def index_user_bank(self):
    # Cache custom task class properties
    # Details regarding custom task context can be found in wiki
    # Custom Task definition can be found in src/__init__.py
    redis = index_user_bank.redis
    solana_client = index_user_bank.solana_client
    db = index_user_bank.db
    # Define lock acquired boolean
    have_lock = False
    # Define redis lock object
    update_lock = redis.lock("user_bank_lock", blocking_timeout=25)

    try:
        # Attempt to acquire lock - do not block if unable to acquire
        have_lock = update_lock.acquire(blocking=False)
        if have_lock:
            logger.info("index_user_bank.py | Acquired lock")
            signatures = solana_client.get_confirmed_signature_for_address2(USER_BANK_ADDRESS, limit=10)
            history = signatures['result']
            for tx_info in history:
                sig = tx_info['signature']
                logger.info(f"index_user_bank.py | {sig}")
                if tx_info['slot'] < MIN_SLOT:
                    logger.info(f"index_user_bank.py | Min slot found ({MIN_SLOT}), exiting")
                    break
                details = solana_client.get_confirmed_transaction(sig)
                meta = details['result']['meta']
                account_keys = details['result']['transaction']['message']['accountKeys']
                instructions = meta['logMessages']
                for msg in instructions:
                    if 'EthereumAddress' in msg:
                        public_key_str, public_key_bytes = parse_eth_address_from_msg(msg)
                        logger.info(f"index_user_bank.py | {public_key_str}")
                        # Rederive address
                        base_address, derived_address = get_address_pair(
                            WAUDIO_PROGRAM_ID,
                            public_key_bytes,
                            USER_BANK_KEY,
                            SPL_TOKEN_ID
                        )
                        bank_acct = str(derived_address[0])
                        logger.info("index_user_bank.py " + str(bank_acct))
                        logger.info("index_user_bank.py " + str(account_keys))
                        # Confirm expected address is present
                        try:
                            bank_acct_index = account_keys.index(bank_acct)
                            if bank_acct_index:
                                logger.info(f"index_user_bank.py | Found known account: {public_key_str}, {bank_acct}")
                        except ValueError as e:
                            logger.info(e)
                        # Confirm whether this eth address is known within protocol
                        get_known_user(public_key_str, db)

            logger.info(f"index_user_bank.py {USER_BANK_ADDRESS}")
        else:
            logger.info("index_user_bank.py | Failed to acquire lock")
    except Exception as e:
        logger.error(
            "index_user_bank.py | Fatal error in main loop",
            exc_info=True
        )
        raise e
    finally:
        if have_lock:
            update_lock.release()