import logging
from typing import Optional, Tuple

import grpc
from sqlalchemy.orm.session import Session

from src.models.core.core_indexed_blocks import CoreIndexedBlocks
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

    endpoint: str
    channel: grpc.Channel
    rpc: ProtocolStub

    chain_id: Optional[str]

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

    def latest_indexed_block(
        self, session: Session, chain_id: str
    ) -> Optional[CoreIndexedBlocks]:
        """Gets the latest indexed block from the database."""
        try:
            return (
                session.query(CoreIndexedBlocks)
                .filter(CoreIndexedBlocks.chain_id == chain_id)
                .order_by(CoreIndexedBlocks.height.desc())
                .first()
            )
        except Exception as e:
            logger.error(f"core_client.py | error getting latest indexed block {e}")
            return None

    def get_indexed_block(self, session: Session, height: int):
        """Gets the specified block from the database. Returns None if not found."""
        try:
            return (
                session.query(CoreIndexedBlocks).filter_by(height=height).one_or_none()
            )
        except Exception as e:
            logger.error(f"core_client.py | error getting block at height {height} {e}")
            return None

    def get_block(
        self, session: Session, height: int
    ) -> Tuple[Optional[BlockResponse], Optional[CoreIndexedBlocks]]:
        """Gets the specified block from core and gets the indexed record. Returns None if not found in either."""
        try:
            return self.rpc.GetBlock(
                GetBlockRequest(height=height)
            ), self.get_indexed_block(session=session, height=height)
        except Exception as e:
            logger.error(f"core_client.py | error getting block {height} {e}")
            return None

    def commit_indexed_block(
        self,
        session: Session,
        chain_id: str,
        height: int,
        blockhash: str,
        parenthash: Optional[str],
    ) -> bool:
        try:
            new_block = CoreIndexedBlocks(
                chain_id=chain_id,
                height=height,
                blockhash=blockhash,
                parenthash=parenthash,
            )
            session.add(new_block)
        except Exception as e:
            logger.error(f"core_client.py | Error committing block {height} {e}")
            return False


core_instance: Optional[CoreClient] = None


def get_core_instance(db: SessionManager) -> CoreClient:
    # pylint: disable=W0603
    global core_instance
    if not core_instance:
        core_instance = CoreClient(db)
        return core_instance
    return core_instance
