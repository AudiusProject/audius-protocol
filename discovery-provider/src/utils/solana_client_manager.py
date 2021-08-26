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

    def get_client(self) -> Client:
        index = random.randrange(0, len(self.clients))
        return self.clients[index]

    def get_sol_tx_info(self, tx_sig: str, retries=DEFAULT_MAX_RETRIES):
        """Fetches a solana transaction by signature with retries and a delay

        If not found, raise an exception
        """
        for index, client in random.sample(
            list(enumerate(self.clients)), k=len(self.clients)
        ):
            endpoint = self.endpoints[index]
            num_retries = retries
            while num_retries > 0:
                try:
                    tx_info = client.get_confirmed_transaction(tx_sig)
                    if tx_info["result"] is not None:
                        return tx_info
                except Exception as e:
                    logger.error(
                        f"solana_client_manager.py | get_sol_tx_info | Error fetching tx {tx_sig} from endpoint {endpoint}, {e}",
                        exc_info=True,
                    )
                num_retries -= 1
                time.sleep(DELAY_SECONDS)
                logger.error(
                    f"solana_client_manager.py | get_sol_tx_info | Retrying tx fetch: {tx_sig} with endpoint {endpoint}"
                )
        raise Exception(
            "solana_client_manager.py | get_sol_tx_info | All requests failed to fetch {tx_sig}"
        )

    def get_confirmed_signature_for_address2(
        self,
        account: Union[str, Account, PublicKey],
        before: Optional[str] = None,
        limit: Optional[int] = None,
    ):
        """Fetches confirmed signatures for transactions given an address.
        Iterates randomly across all clients before failure.
        """
        for client in random.sample(self.clients, k=len(self.clients)):
            try:
                return client.get_confirmed_signature_for_address2(
                    account, before, limit
                )
            except Exception:
                continue
        raise Exception(
            "solana_client_manager.py | get_confirmed_signature_for_address2 | All requests failed"
        )
