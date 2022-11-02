"""
Interface for using a web3 provider
"""

import os
from typing import Optional

from src.utils import helpers
from src.utils.config import shared_config
from src.utils.multi_provider import MultiProvider
from web3 import HTTPProvider, Web3
from web3.middleware import geth_poa_middleware

web3: Optional[Web3] = None


NETHERMIND_BLOCK_OFFSET = os.getenv("audius_web3_nethermind_block_offset")


def get_web3():
    # pylint: disable=W0603
    global web3
    if helpers.get_final_poa_block(shared_config):
        web3endpoint = os.getenv("audius_web3_nethermind_rpc")
        web3 = Web3(HTTPProvider(web3endpoint))

        # required middleware for POA
        # https://web3py.readthedocs.io/en/latest/middleware.html#proof-of-authority
        web3.middleware_onion.inject(geth_poa_middleware, layer=0)
        return web3

    web3endpoint = helpers.get_web3_endpoint(shared_config)
    web3 = Web3(HTTPProvider(web3endpoint))

    return web3


eth_web3: Optional[Web3] = None


def get_eth_web3():
    # pylint: disable=W0603
    global eth_web3
    if not eth_web3:
        eth_web3 = Web3(MultiProvider(shared_config["web3"]["eth_provider_url"]))
        return eth_web3
    return eth_web3
