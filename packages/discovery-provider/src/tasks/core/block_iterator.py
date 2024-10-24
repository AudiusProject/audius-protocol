import logging

import grpc
from sqlalchemy import desc
from sqlalchemy.orm.session import Session

from src.models.core.core_blocks_indexing import CoreBlocksIndexing
from src.tasks.core.gen import protocol_pb2, protocol_pb2_grpc
from src.utils.config import shared_config
from src.utils.session_manager import SessionManager

logger = logging.getLogger(__name__)

environment = shared_config["discprov"]["env"]


class SingletonMeta(type):
    """A thread-safe implementation of Singleton."""

    _instances = {}

    def __call__(cls, *args, **kwargs):
        if cls not in cls._instances:
            instance = super().__call__(*args, **kwargs)
            cls._instances[cls] = instance
        return cls._instances[cls]


class CoreBlockIterator(metaclass=SingletonMeta):
    """Iterates core blocks using the db to track state."""
    db: SessionManager
    endpoint: str
    channel: grpc.Channel
    rpc: protocol_pb2_grpc.ProtocolStub

    chain_id: str
    synced: bool

    current_block: int
    latest_node_height: int

    def __init__(self, db):
        self.db = db

        # init grpc connection
        self.endpoint = self.get_core_endpoint()
        self.channel = grpc.insecure_channel(self.endpoint)
        self.rpc = protocol_pb2_grpc.ProtocolStub(self.channel)

        res = self._node_info()
        self.chain_id = res.chainid
        self.synced = res.synced
        logger.info(f"index_core_blocks.py | node info {res}")
        self.latest_node_height = res.current_height

        self.current_block = 1

    def get_core_endpoint(self) -> str:
        if environment == "prod" or environment == "stage":
            return "core:50051"
        return "core-discovery-1:50051"

    def next_block(self, db: SessionManager):
        """Reads the latest block from the database.
        Queries the core node via grpc for the next block.
        If that block is found, returns. Otherwise returns None.
        Does not commit the read block to the database."""
        session = db.scoped_session()
        latest_indexed_block = (
            session.query(CoreBlocksIndexing)
            .filter(CoreBlocksIndexing.chain_id == self.chain_id)
            .order_by(desc(CoreBlocksIndexing.height))
            .first()
        )

        current_block = 1
        if latest_indexed_block:
            current_block = latest_indexed_block.height

        block = self._get_block(current_block)

        if block.height < 0:
            return None

        return block

    def commit_block(
        self,
        session: Session,
        blockhash: str,
        parenthash: str,
        chain_id: str,
        height: int,
    ):
        """Commits a read block to the data"""
        new_block = CoreBlocksIndexing(
            blockhash=blockhash, parenthash=parenthash, chain_id=chain_id, height=height
        )
        session.add(new_block)

    def _get_block(self, height: int):
        block_request = protocol_pb2.GetBlockRequest(height=height)
        response = self.rpc.GetBlock(block_request)
        return response

    def _ping(self):
        ping_request = protocol_pb2.PingRequest()
        response = self.rpc.Ping(ping_request)
        return response

    def _node_info(self):
        node_info_request = protocol_pb2.GetNodeInfoRequest()
        response = self.rpc.GetNodeInfo(node_info_request)
        return response
