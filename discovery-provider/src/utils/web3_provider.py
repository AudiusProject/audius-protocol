"""
Interface for using a web3 provider
"""

import os
from typing import Optional

from src.models.indexing.block import Block
from src.utils import db_session, helpers
from src.utils.config import shared_config
from src.utils.multi_provider import MultiProvider
from web3 import HTTPProvider, Web3
from web3.middleware import geth_poa_middleware

web3: Optional[Web3] = None
LOCAL_RPC = "http://chain:8545"


def get_web3():
    # only use ACDC web3 provider when
    # final_poa_block is indexed

    # pylint: disable=W0603
    global web3
    final_poa_block = helpers.get_final_poa_block(shared_config)
    db = db_session.get_db_read_replica()
    with db.scoped_session() as session:
        latest_block_query = session.query(Block).filter(Block.is_current == True).all()

        if len(latest_block_query) != 1:
            raise Exception("Expected SINGLE row marked as current")

        latest_block_record = helpers.model_to_dictionary(latest_block_query[0])
        latest_indexed_block_num = latest_block_record["number"] or 0

    if final_poa_block and latest_indexed_block_num >= final_poa_block:
        return get_nethermind_web3()

    # fallback to POA endpoint
    web3endpoint = helpers.get_web3_endpoint(shared_config)
    web3 = Web3(HTTPProvider(web3endpoint))

    return web3


def get_nethermind_web3(web3endpoint=None):
    if not web3endpoint:
        web3endpoint = os.getenv("audius_web3_nethermind_rpc")
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
