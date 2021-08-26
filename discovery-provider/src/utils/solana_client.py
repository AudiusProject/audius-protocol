import time
import logging
from typing import Optional, Union
from solana.account import Account
from solana.publickey import PublicKey
from solana.rpc.api import Client
from src.utils.config import shared_config

logger = logging.getLogger(__name__)

SOLANA_ENDPOINT = shared_config["solana"]["endpoint"]

# maximum number of times to retry get_confirmed_transaction call
DEFAULT_MAX_RETRIES = 5
# number of seconds to wait between calls to get_confirmed_transaction
DELAY_SECONDS = 0.2


class SolanaClient:
    def __init__(self) -> None:
        self.client = Client(SOLANA_ENDPOINT)

    def get_sol_tx_info(self, tx_sig: str, retries=DEFAULT_MAX_RETRIES):
        """Fetches a solana transaction by signature with retries and a delay

        If not found, raise an exception
        """
        while retries > 0:
            try:
                tx_info = self.client.get_confirmed_transaction(tx_sig)
                if tx_info["result"] is not None:
                    return tx_info
            except Exception as e:
                logger.error(
                    f"get_sol_tx_info | Error fetching tx {tx_sig}, {e}",
                    exc_info=True,
                )
            retries -= 1
            time.sleep(DELAY_SECONDS)
            logger.error(f"get_sol_tx_info | Retrying tx fetch: {tx_sig}")
        raise Exception(f"get_sol_tx_info | Failed to fetch {tx_sig}")

    def get_confirmed_signature_for_address2(
        self,
        account: Union[str, Account, PublicKey],
        before: Optional[str] = None,
        limit: Optional[int] = None,
    ):
        """Pass-through for get_confirmed_signature_for_address2"""
        return self.client.get_confirmed_signature_for_address2(account, before, limit)
