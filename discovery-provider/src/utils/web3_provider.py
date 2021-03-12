"""
Interface for using a web3 provider
"""

from web3 import Web3
from src.utils import helpers
from src.utils.config import shared_config
from src.utils.multi_provider import MultiProvider

def get_web3():
    web3endpoint = helpers.get_web3_endpoint(shared_config)
    web3 = Web3(MultiProvider(web3endpoint))
    return web3
