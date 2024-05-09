"""
Interface for using a web3 provider
"""

import logging
import math
import os
from typing import Optional

import requests
from web3 import HTTPProvider, Web3
from web3.middleware import geth_poa_middleware

from src.utils.config import shared_config
from src.utils.multi_provider import MultiProvider

logger = logging.getLogger(__name__)

web3: Optional[Web3] = None

GATEWAY_FALLBACK_BLOCKDIFF = 10000


def get_web3(web3endpoint=None):
    # pylint: disable=W0603
    global web3

    if web3:
        return web3

    if web3endpoint:
        web3 = Web3(HTTPProvider(web3endpoint))
    else:
        local_rpc = os.getenv("audius_web3_localhost")
        local_web3 = Web3(HTTPProvider(local_rpc))
        gateway_web3 = Web3(HTTPProvider(os.getenv("audius_web3_host")))
        # attempt local rpc, check if healthy
        try:
            block_diff = math.abs(
                local_web3.eth.get_block_number() - gateway_web3.eth.get_block_number()
            )
            resp = requests.get(local_rpc + "/health")
            if resp.status_code == 200 and block_diff < GATEWAY_FALLBACK_BLOCKDIFF:
                web3 = local_web3
                logger.info("web3_provider.py | using local RPC")
            else:
                raise Exception("local RPC unhealthy or unreachable")
        except Exception as e:
            logger.warn(e)
            web3 = gateway_web3

    web3.strict_bytes_type_checking = False
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
