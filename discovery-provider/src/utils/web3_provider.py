"""
Interface for using a web3 provider
"""

import os
from typing import Optional

from src.utils.config import shared_config
from src.utils.multi_provider import MultiProvider
from web3 import HTTPProvider, Web3
from web3.middleware import geth_poa_middleware

web3: Optional[Web3] = None
LOCAL_RPC = "http://chain:8545"  # TODO: Needs nethermind locally I think


def get_web3(web3endpoint=None):
    # only use ACDC web3 provider when
    # final_poa_block is indexed

    # pylint: disable=W0603
    global web3
    if not web3endpoint:
        web3endpoint = os.getenv("audius_web3_host")
    web3 = Web3(HTTPProvider(web3endpoint))

    # required middleware for POA
    # https://web3py.readthedocs.io/en/latest/middleware.html#proof-of-authority
    web3.middleware_onion.inject(geth_poa_middleware, layer=0)
    return web3


eth_web3: Optional[Web3] = None


def get_eth_web3():
    # pylint: disable=W0603
    global eth_web3
    if not eth_web3:
        eth_web3 = Web3(MultiProvider(shared_config["web3"]["eth_provider_url"]))
        return eth_web3
    return eth_web3
