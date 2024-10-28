import logging
from typing import Optional

import grpc
from sqlalchemy.orm.session import Session

from src.tasks.core.gen.protocol_pb2 import (
    BlockResponse,
    GetBlockRequest,
    GetNodeInfoRequest,
    NodeInfoResponse,
    PingRequest,
    PingResponse,
)
from src.tasks.core.gen.protocol_pb2_grpc import ProtocolStub
from src.utils.config import shared_config
from src.utils.session_manager import SessionManager

logger = logging.getLogger(__name__)

environment = shared_config["discprov"]["env"]


class CoreClient:
    """A simplified client for the core."""

    db: SessionManager
    endpoint: str
    channel: grpc.Channel
    rpc: ProtocolStub

    def __init__(self, db: SessionManager):
        self.endpoint = self.get_core_endpoint()
        self.channel = grpc.insecure_channel(self.endpoint)
        self.rpc = ProtocolStub(channel=self.channel)

    def get_core_endpoint(self) -> str:
        if environment == "prod" or environment == "stage":
            return "core:50051"
        return "core-discovery-1:50051"

    def ping(self) -> Optional[PingResponse]:
        try:
            return self.rpc.Ping(PingRequest())
        except Exception as e:
            logger.error(f"core_client.py | ping {e}")
            return None

    def get_node_info(self) -> Optional[NodeInfoResponse]:
        try:
            return self.rpc.GetNodeInfo(GetNodeInfoRequest())
        except Exception as e:
            logger.error(f"core_client.py | node info {e}")
            return None

    def latest_indexed_block(self):
        """Gets the latest indexed block from the database."""
        pass

    def get_indexed_block(self, height: int):
        """Gets the specified block from the database. Returns None if not found."""
        pass

    def get_block(self, height: int) -> Optional[BlockResponse]:
        """Gets the specified block from core. Returns None if not found."""
        try:
            return self.rpc.GetBlock(GetBlockRequest(height=height))
        except Exception as e:
            logger.error(f"core_client.py | error getting block {height} {e}")
            return None

    def commit_indexed_block(
        self,
        session: Session,
        chain_id: str,
        height: int,
        blockhash: int,
        parenthash: int,
    ):
        pass
