import random
import time
import logging
from typing import Optional, Union
from solana.account import Account
from solana.publickey import PublicKey
from solana.rpc.api import Client
from src.utils.config import shared_config

logger = logging.getLogger(__name__)

SOLANA_ENDPOINTS = shared_config["solana"]["endpoint"]

# maximum number of times to retry get_confirmed_transaction call
DEFAULT_MAX_RETRIES = 5
# number of seconds to wait between calls to get_confirmed_transaction
DELAY_SECONDS = 0.2


class SolanaClientManager:
    def __init__(self) -> None:
        self.endpoints = SOLANA_ENDPOINTS.split(",")
        self.clients = [Client(endpoint) for endpoint in self.endpoints]

    def get_client(self, randomize=False) -> Client:
        if not self.clients:
            raise Exception(
                "solana_client_manager.py | get_client | There are no solana clients"
            )
        if not randomize:
            return self.clients[0]
        index = random.randrange(0, len(self.clients))
        return self.clients[index]

    def get_sol_tx_info(self, tx_sig: str, retries=DEFAULT_MAX_RETRIES):
        """Fetches a solana transaction by signature with retries and a delay."""

        def handle_get_sol_tx_info(client, index):
            endpoint = self.endpoints[index]
            num_retries = retries
            while num_retries > 0:
                try:
                    tx_info = client.get_confirmed_transaction(tx_sig)
                    if tx_info["result"] is not None:
                        return tx_info
                except Exception as e:
                    logger.error(
                        f"solana_client_manager.py | get_sol_tx_info | \
                            Error fetching tx {tx_sig} from endpoint {endpoint}, {e}",
                        exc_info=True,
                    )
                num_retries -= 1
                time.sleep(DELAY_SECONDS)
                logger.error(
                    f"solana_client_manager.py | get_sol_tx_info | Retrying tx fetch: {tx_sig} with endpoint {endpoint}"
                )
            raise Exception(
                f"solana_client_manager.py | get_sol_tx_info | Failed to fetch {tx_sig} with endpoint {endpoint}"
            )

        return _try_all(
            self.clients,
            handle_get_sol_tx_info,
            "solana_client_manager.py | get_sol_tx_info | All requests failed to fetch {tx_sig}",
        )

    def get_confirmed_signature_for_address2(
        self,
        account: Union[str, Account, PublicKey],
        before: Optional[str] = None,
        limit: Optional[int] = None,
    ):
        """Fetches confirmed signatures for transactions given an address."""

        def handle_get_confirmed_signature_for_address2(client):
            return client.get_confirmed_signature_for_address2(account, before, limit)

        return _try_all(
            self.clients,
            handle_get_confirmed_signature_for_address2,
            "solana_client_manager.py | get_confirmed_signature_for_address2 | All requests failed",
        )


def _try_all(iterable, func, message, randomize=False):
    """Executes a function with retries across the iterable.
    If all executions fail, raise an exception."""
    items = list(enumerate(iterable))
    items = items if not randomize else random.sample(items, k=len(items))
    for index, value in items:
        try:
            return func(value, index)
        except Exception:
            continue
    raise Exception(message)
