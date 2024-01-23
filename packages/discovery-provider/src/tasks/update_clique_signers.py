import logging

import requests

from src.tasks.celery_app import celery
from src.utils.get_all_nodes import get_all_discovery_nodes_cached
from src.utils.prometheus_metric import save_duration_metric

logger = logging.getLogger(__name__)

LOCAL_RPC = "http://chain:8545"
DOUBLE_CAST_ERROR_CODE = -32603


def clique_propose(wallet: str, vote: bool):
    propose_data = (
        '{"method":"clique_propose","params":["'
        + wallet
        + '", '
        + str(vote).lower()
        + "]}"
    )
    response = requests.post(LOCAL_RPC, data=propose_data)
    return response.json()


def update_signers(self, redis):
    shared_config = update_clique_signers.shared_config
    current_wallet = shared_config["delegate"]["owner_wallet"].lower()

    # the maximum signers in addition to the registered static nodes
    max_signers = int(shared_config["discprov"]["max_signers"])

    nodes = get_all_discovery_nodes_cached(redis)
    other_wallets = set(
        [node["delegateOwnerWallet"].lower() for node in nodes] if nodes else None
    )
    logger.info(
        f"update_clique_signers.py | Other registered discovery addresses: {other_wallets}"
    )

    # get current signers
    get_signers_data = '{"method":"clique_getSigners","params":[]}'
    signers_response = requests.post(LOCAL_RPC, data=get_signers_data)
    signers_response_dict = signers_response.json()
    current_signers = set(
        [wallet.lower() for wallet in signers_response_dict["result"]]
    )
    logger.info(f"update_clique_signers.py | Current chain signers: {current_signers}")

    # only signers can propose
    if current_wallet not in current_signers:
        return

    # propose registered nodes as signers
    current_signers.remove(current_wallet)
    add_wallets = sorted(list(other_wallets - current_signers))[:max_signers]
    for wallet in add_wallets:
        response_dict = clique_propose(wallet, True)
        if (
            "error" in response_dict
            and response_dict["error"]["code"] != DOUBLE_CAST_ERROR_CODE
        ):
            logger.error(
                f"update_clique_signers.py | Failed to add signer {wallet} with error {response_dict['error']['message']}"
            )
        else:
            logger.info(f"update_clique_signers.py | Proposed to add signer {wallet}")

    # remove unregistered nodes as signers
    remove_wallets = sorted(list(current_signers - other_wallets))
    for wallet in remove_wallets:
        response_dict = clique_propose(wallet, False)
        if (
            "error" in response_dict
            and response_dict["error"]["code"] != DOUBLE_CAST_ERROR_CODE
        ):
            logger.error(
                f"update_clique_signers.py | Failed to remove signer {wallet} with error {response_dict['error']['message']}"
            )
        else:
            logger.info(
                f"update_clique_signers.py | Proposed to remove signer {wallet}"
            )


# ####### CELERY TASKS ####### #
@celery.task(name="update_clique_signers", bind=True)
@save_duration_metric(metric_group="celery_task")
def update_clique_signers(self):
    redis = update_clique_signers.redis
    have_lock = False
    update_lock = redis.lock("network_peers_lock", timeout=7200)
    try:
        have_lock = update_lock.acquire(blocking=False)
        if have_lock:
            # if not os.getenv("audius_discprov_dev_mode"):
            #     update_signers(self, redis)
            pass
        else:
            logger.info(
                "update_clique_signers.py | Failed to acquire update_clique_signers"
            )
    except Exception as e:
        logger.error(
            "update_clique_signers.py | Fatal error in main loop", exc_info=True
        )
        raise e
    finally:
        if have_lock:
            update_lock.release()
