"""
Interface for using a web3 provider
"""

from web3 import HTTPProvider, Web3
from src.utils import helpers
from src.utils.config import shared_config


def get_web3():
    web3endpoint = helpers.get_web3_endpoint(shared_config)
    web3 = Web3(HTTPProvider(web3endpoint))
    return web3
