"""
Interface for using a web3 provider
"""

import logging
from typing import Optional

from web3 import Web3

from src.utils.config import shared_config
from src.utils.multi_provider import MultiProvider

logger = logging.getLogger(__name__)

eth_web3: Optional[Web3] = None


def get_eth_web3():
    # pylint: disable=W0603
    global eth_web3
    if not eth_web3:
        provider = MultiProvider(shared_config["web3"]["eth_provider_url"])
        for p in provider.providers:
            p.middlewares.clear()
        # Remove the default JSON-RPC retry middleware
        # as it correctly cannot handle eth_getLogs block range
        # throttle down.
        # See https://web3py.readthedocs.io/en/stable/examples.html
        eth_web3 = Web3(provider)
        eth_web3.strict_bytes_type_checking = False
        return eth_web3
    return eth_web3
