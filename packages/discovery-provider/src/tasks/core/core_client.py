import logging
from typing import Optional

import grpc

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

logger = logging.getLogger(__name__)

environment = shared_config["discprov"]["env"]


class CoreClient:
    """Typesafe gRPC client for core."""

    endpoint: str
    channel: grpc.Channel
    rpc: ProtocolStub

    chain_id: Optional[str]

    logger: logging.Logger

    def __init__(self):
        self.endpoint = self.get_core_endpoint()
        self.channel = grpc.insecure_channel(self.endpoint)
        self.rpc = ProtocolStub(channel=self.channel)
        self.logger = logger

    def set_logger(self, l: logging.Logger):
        self.logger = l

    def get_core_endpoint(self) -> str:
        if environment == "prod" or environment == "stage":
            return "core:50051"
        return "audiusd-1:50051"

    def ping(self) -> PingResponse:
        return self.rpc.Ping(PingRequest())

    def get_node_info(self) -> NodeInfoResponse:
        return self.rpc.GetNodeInfo(GetNodeInfoRequest())

    def get_block(self, height: int) -> BlockResponse:
        """Gets the specified block from core and gets the indexed record. Returns None if not found in either."""
        return self.rpc.GetBlock(GetBlockRequest(height=height))


core_instance: Optional[CoreClient] = None


def get_core_instance() -> CoreClient:
    # pylint: disable=W0603
    global core_instance
    if not core_instance:
        core_instance = CoreClient()
        return core_instance
    return core_instance
