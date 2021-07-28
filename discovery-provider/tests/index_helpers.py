# Helper methods for testing indexing
from web3 import Web3


class AttrDict(dict):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.__dict__ = self


class IPFSClient:
    def __init__(self, metadata_dict):
        self.metadata_dict = metadata_dict

    def get_metadata(self, multihash, format, endpoint):
        return self.metadata_dict[multihash]


class UpdateTask:
    def __init__(self, ipfs_client, web3, challenge_event_bus, redis=None):
        self.ipfs_client = ipfs_client
        self.web3 = web3
        self.challenge_event_bus = challenge_event_bus
        self.redis = redis
