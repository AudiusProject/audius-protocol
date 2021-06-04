class IndexingError(Exception):
    """Exception raised for errors in the indexing flow.

    Attributes:
        type -- One of 'user', 'user_replica_set', 'user_library', 'tracks', 'social_features', 'playlists'
        blocknumber -- block number of error
        blockhash -- block hash of error
        txhash -- transaction hash of error
        message -- error message
    """

    def __init__(self, type, blocknumber, blockhash, txhash, message):
        super(IndexingError, self).__init__(message)
        self.type = type
        self.blocknumber = blocknumber
        self.blockhash = blockhash
        self.txhash = txhash
        self.message = message
