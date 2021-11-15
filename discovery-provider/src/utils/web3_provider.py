"""
Interface for using a web3 provider
"""

from typing import Optional
from web3 import HTTPProvider, Web3
from src.utils import helpers
from src.utils.config import shared_config
from src.utils.multi_provider import MultiProvider


web3: Optional[Web3] = None


def get_web3():
    # pylint: disable=W0603
    global web3
    if not web3:
        web3endpoint = helpers.get_web3_endpoint(shared_config)
        web3 = Web3(HTTPProvider(web3endpoint))
        return web3
    return web3


eth_web3: Optional[Web3] = None


def get_eth_web3():
    # pylint: disable=W0603
    global eth_web3
    if not eth_web3:
        eth_web3 = Web3(MultiProvider(shared_config["web3"]["eth_provider_url"]))
        return eth_web3
    return eth_web3
