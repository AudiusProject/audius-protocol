import logging
from typing import Optional

import grpc

from src.tasks.core.audiusd_gen.core.v1.service_pb2_grpc import CoreServiceStub
from src.tasks.core.audiusd_gen.core.v1.types_pb2 import (
    GetBlockRequest,
    GetBlockResponse,
    GetNodeInfoRequest,
    PingRequest,
)
from src.tasks.core.gen.protocol_pb2 import BlockResponse as LegacyBlockResponse
from src.tasks.core.gen.protocol_pb2 import GetBlockRequest as LegacyGetBlockRequest
from src.tasks.core.gen.protocol_pb2 import (
    GetNodeInfoRequest as LegacyGetNodeInfoRequest,
)
from src.tasks.core.gen.protocol_pb2 import NodeInfoResponse as LegacyNodeInfoResponse
from src.tasks.core.gen.protocol_pb2 import PingRequest as LegacyPingRequest
from src.tasks.core.gen.protocol_pb2 import PingResponse as LegacyPingResponse
from src.tasks.core.gen.protocol_pb2 import SignedTransaction as LegacySignedTransaction
from src.tasks.core.gen.protocol_pb2 import TransactionResponse
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

    def __init__(self):
        self.endpoint = self.get_core_endpoint()
        self.channel = grpc.insecure_channel(self.endpoint)
        self.rpc = ProtocolStub(channel=self.channel)

    def get_core_endpoint(self) -> str:
        if environment == "prod" or environment == "stage":
            return "core:50051"
        return "audiusd-1:50051"

    def ping(self) -> LegacyPingResponse:
        return self.rpc.Ping(LegacyPingRequest())

    def get_node_info(self) -> LegacyNodeInfoResponse:
        return self.rpc.GetNodeInfo(LegacyGetNodeInfoRequest())

    def get_block(self, height: int) -> LegacyBlockResponse:
        """Gets the specified block from core and gets the indexed record. Returns None if not found in either."""
        return self.rpc.GetBlock(LegacyGetBlockRequest(height=height))


class AudiusdClient(CoreClient):
    """
    AudiusdClient is a drop-in replacement for CoreClient, using the new audiusd backend.
    This allows migration without changing all usages of CoreClient immediately.
    """

    endpoint: str
    channel: grpc.Channel
    core_service: CoreServiceStub

    def __init__(self):
        self.endpoint = self.get_audiusd_endpoint()
        self.channel = grpc.insecure_channel(self.endpoint)
        self.core_service = CoreServiceStub(channel=self.channel)

    def get_audiusd_endpoint(self) -> str:
        if environment == "prod" or environment == "stage":
            return "core:50051"
        return "audiusd-1:50051"

    def get_core_endpoint(self) -> str:
        # For compatibility with CoreClient interface
        return self.get_audiusd_endpoint()

    def get_node_info(self):
        # Return type: GetNodeInfoResponse (from audiusd_gen)
        return self.core_service.GetNodeInfo(GetNodeInfoRequest())

    def ping(self):
        # Return type: PingResponse (from audiusd_gen)
        return self.core_service.Ping(PingRequest())

    def get_block(self, height: int):
        # Return type: GetBlockResponse (from audiusd_gen)
        res: GetBlockResponse = self.core_service.GetBlock(
            GetBlockRequest(height=height)
        )
        block = res.block

        # Convert transactions by serializing/deserializing
        converted_transactions = []
        for tx in block.transactions:
            legacy_tx = LegacySignedTransaction()
            legacy_tx.ParseFromString(tx.transaction.SerializeToString())
            converted_transactions.append(
                TransactionResponse(
                    txhash=tx.hash,
                    block_height=tx.height,
                    block_hash=tx.hash,
                    transaction=legacy_tx,
                )
            )

        return LegacyBlockResponse(
            blockhash=block.hash,
            chainid=block.chain_id,
            proposer=block.proposer,
            height=block.height,
            current_height=res.current_height,
            timestamp=block.timestamp,
            transaction_responses=converted_transactions,
        )


core_instance: Optional[CoreClient] = None


def get_core_instance() -> CoreClient:
    # pylint: disable=W0603
    global core_instance
    try:
        print("CORE_CLIENT Attempting to connect to AudiusdClient...")
        logger.info("CORE_CLIENT Attempting to connect to AudiusdClient...")
        client = AudiusdClient()
        res = client.ping()
        print(
            f"CORE_CLIENT AudiusdClient ping response: {getattr(res, 'message', None)}"
        )
        logger.info(
            f"CORE_CLIENT AudiusdClient ping response: {getattr(res, 'message', None)}"
        )
        # If no exception, use AudiusdClient
        if not isinstance(core_instance, AudiusdClient):
            print("CORE_CLIENT Switching to AudiusdClient.")
            logger.info("CORE_CLIENT Switching to AudiusdClient.")
        core_instance = client
    except Exception as e:
        print(f"CORE_CLIENT Failed to ping audiusd: {e}")
        logger.error(f"CORE_CLIENT Failed to ping audiusd: {e}")
        print("CORE_CLIENT Falling back to legacy CoreClient implementation.")
        logger.info("CORE_CLIENT Falling back to legacy CoreClient implementation.")
        if not isinstance(core_instance, CoreClient):
            print("CORE_CLIENT Switching to CoreClient.")
            logger.info("CORE_CLIENT Switching to CoreClient.")
        core_instance = CoreClient()
    return core_instance
