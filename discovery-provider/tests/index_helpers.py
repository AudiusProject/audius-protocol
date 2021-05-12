# Helper methods for testing indexing

class AttrDict(dict):
    def __init__(self, *args, **kwargs):
        super(AttrDict, self).__init__(*args, **kwargs)
        self.__dict__ = self

class IPFSClient:
    def __init__(self, metadata_dict):
        self.metadata_dict = metadata_dict

    def get_metadata(self, multihash, format, endpoint):
        return self.metadata_dict[multihash]

class Web3:
    def toHex(self, blockHash):
        return '0x'

class UpdateTask:
    def __init__(self, ipfs_client, web3):
        self.ipfs_client = ipfs_client
        self.web3 = web3
