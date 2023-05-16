"""
Interface for using a web3 provider
"""

import logging
import os
from typing import Optional

import requests
from src.utils.config import shared_config
from src.utils.multi_provider import MultiProvider
from web3 import HTTPProvider, Web3
from web3.middleware import geth_poa_middleware

logger = logging.getLogger(__name__)

web3: Optional[Web3] = None
LOCAL_RPC = "http://chain:8545"


def get_web3(web3endpoint=None):
    # pylint: disable=W0603
    global web3
    if not web3endpoint:
        # attempt local rpc, check if healthy
        r = requests.get(LOCAL_RPC + "/health")
        if r.status_code == 200:
            web3endpoint = LOCAL_RPC
            logger.info("web3_provider.py | using local RPC")
        else:
            # if local rpc isn't healthy fall back to gateway
            web3endpoint = os.getenv("audius_web3_host")
            logger.warn("web3_provider.py | falling back to gateway RPC")
    web3 = Web3(HTTPProvider(web3endpoint))

    # required middleware for POA
    # https://web3py.readthedocs.io/en/latest/middleware.html#proof-of-authority
    web3.middleware_onion.inject(geth_poa_middleware, layer=0)
    return web3


eth_web3: Optional[Web3] = None


# mainnet eth, not ACDC
def get_eth_web3():
    # pylint: disable=W0603
    global eth_web3
    if not eth_web3:
        eth_web3 = Web3(MultiProvider(shared_config["web3"]["eth_provider_url"]))
        return eth_web3
    return eth_web3
