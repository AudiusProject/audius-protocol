import concurrent.futures
import logging
from typing import Dict, List, Literal, Set

import requests
from redis import Redis
from src.tasks.celery_app import celery
from src.utils.prometheus_metric import save_duration_metric
from src.utils.session_manager import SessionManager

Chain = Literal["eth", "sol"]

logger = logging.getLogger(__name__)

eth_nft_owners_prefix = "eth_nft_owners"
sol_nft_owners_prefix = "sol_nft_owners"

# make this an env var, diff for staging vs. prod
OPENSEA_API_URL = "https://api.opensea.io/api/v1/assets"
OPENSEA_API_ASSETS_LIMIT = 50  # default limit is 20


def make_premium_content_nft_owners_cache_key(
    chain: Chain, contract_address: str
) -> str:
    prefix = eth_nft_owners_prefix if chain == "eth" else sol_nft_owners_prefix
    return f"{prefix}:{contract_address}"


def get_premium_content_collection_contract_addresses(db) -> Dict[Chain, List[str]]:
    raise NotImplementedError("coming soon...")


# update the current owner ids set with the user ids matching
# the users whose wallet addresses are in our users table
def update_owners(owner_ids: Set[int], creators: List[str], owners: List[str]):
    pass


# Returns list of user ids that own an nft from the
# collection matching the given contract address
def fetch_eth_nft_audius_owners_for_collection(
    contract_address: str,
) -> Set[int]:
    query_param_str = f"?asset_contract_address={contract_address}&limit={OPENSEA_API_ASSETS_LIMIT}&include_orders=false"
    cursor = None  # this will represent the assets page which we are fetching for this contract address
    results: Set[int] = set()
    while True:
        if cursor:
            query_param_str = f"{query_param_str}&cursor={cursor}"
        endpoint = f"{OPENSEA_API_URL}{query_param_str}"
        try:
            # todo: what's a good timeout below?
            response = requests.get(endpoint, timeout=10)
            if response.status_code != 200:
                raise Exception(
                    f"Failed to get assets at endpoint {endpoint} \
                    failed with status code {response.status_code}"
                )
            json = response.json()["data"]
            assets = json["assets"]
            asset_creators = list(map(lambda a: a["creator"]["address"], assets))
            asset_owners = list(map(lambda a: a["owner"]["address"], assets))
            # todo: confirm logic with asset creators and owners for who
            # currently owns the nft
            # also make requests to events endpoint and do similar logic
            # (see client logic)
            update_owners(results, asset_creators, asset_owners)
            cursor = json["next"]
            if not cursor:
                break
        except Exception as e:
            logger.error(
                f"index_nfts.py | fetch_eth_nft_audius_owners_for_collection | {e}"
            )
    return results


def update_contract_address_cache_entry(
    redis: Redis, chain: Chain, contract_address: str, owner_ids: Set[int]
):
    key = make_premium_content_nft_owners_cache_key(chain, contract_address)
    old_owner_ids = redis.smembers(key)
    old_owner_ids = {int(old_owner_id.decode()) for old_owner_id in old_owner_ids}
    redis.srem(key, *old_owner_ids)
    redis.sadd(key, *owner_ids)


def index_eth_nfts(redis, contract_addresses: List[str]):
    # todo: what's a good number for max_workers below?
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        futures = {
            executor.submit(
                fetch_eth_nft_audius_owners_for_collection, contract_address
            ): contract_address
            for contract_address in contract_addresses
        }
        try:
            for future in concurrent.futures.as_completed(
                futures,
                # todo: what's a good number for timeout below?
                timeout=45,
            ):
                contract_address = futures[future]
                owner_ids = future.result()
                update_contract_address_cache_entry(
                    redis, "eth", contract_address, owner_ids
                )
        except Exception as e:
            logger.error(f"index_nfts.py | index_eth_nfts | {e}")
            # todo: do i need the next 2 lines?
            # executor._threads.clear()
            # concurrent.futures.thread._threads_queues.clear()
            raise e


def index_sol_nfts(redis, contract_addresses: List[str]):
    raise NotImplementedError("coming soon...")


def index_nfts(db, redis):
    collection_contract_addresses = get_premium_content_collection_contract_addresses(
        db
    )
    eth_collection_contract_addresses = collection_contract_addresses["eth"]
    sol_collection_contract_addresses = collection_contract_addresses["sol"]
    index_eth_nfts(redis, eth_collection_contract_addresses)
    index_sol_nfts(redis, sol_collection_contract_addresses)


@celery.task(name="index_nfts", bind=True)
@save_duration_metric(metric_group="celery_task")
def index_nfts_task(self):
    db: SessionManager = index_nfts_task.db
    redis: Redis = index_nfts_task.redis
    have_lock = False
    # todo: what's a good timeout number below?
    update_lock = redis.lock("index_nfts_lock", timeout=60)
    try:
        have_lock = update_lock.acquire(blocking=False)
        if have_lock:
            index_nfts(db, redis)
        else:
            logger.info("index_nfts.py | Failed to acquire lock")
    except Exception as e:
        logger.error("index_nfts.py | Fatal error in main loop", exc_info=True)
        raise e
    finally:
        if have_lock:
            update_lock.release()
