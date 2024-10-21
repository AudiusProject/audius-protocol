import logging

import grpc

from src.tasks.core.gen import protocol_pb2, protocol_pb2_grpc
from src.utils.config import shared_config

logger = logging.getLogger(__name__)

environment = shared_config["discprov"]["env"]


class CoreBlockIterator:
    """Iterates core blocks using the db to track state."""

    def __init__(self, db):
        self.db = db

        # init grpc connection
        self.endpoint = self.get_core_endpoint()
        self.channel = grpc.insecure_channel(self.endpoint)
        self.rpc = protocol_pb2_grpc.ProtocolStub(self.channel)

    def get_core_endpoint(self) -> str:
        if environment == "prod" or environment == "stage":
            return "core:50051"
        return "core-discovery-1:50051"

    def next_block(self):
        """Reads the latest block + 1 from the database.
        Queries the core node via grpc for the next block.
        If that block is found, returns. Otherwise returns None.
        Does not commit the read block to the database."""

        self.ping()

        # read block from db

        # if block exists, call grpc

        # if block exists and exists in core, return block
        # else return None

        # if block not exists in db, start at block 1
        # if block exists, return block
        # if block 1 not exist, return None

        return

    def commit_block(self, block_num: int):
        """Commits a read block to the data"""
        # insert new row into core_block_indexed table
        # block_num, chain_id, time
        return

    def get_block(self, height: int):
        block_request = protocol_pb2.GetBlockRequest(height=height)
        response = self.rpc.GetBlock(block_request)
        return response

    def ping(self):
        ping_request = protocol_pb2.PingRequest()
        response = self.stub.Ping(ping_request)
        return response
