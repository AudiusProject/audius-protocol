class IndexingError(Exception):
    """
    Exception raised for errors in the indexing flow.

    Attributes:
        type -- One of 'session.commit', 'tx', 'user', 'user_replica_set', 'user_library', 'tracks', 'social_features', 'playlists'
        blocknumber -- block number of error
        blockhash -- block hash of error
        txhash -- transaction hash of error
        message -- error message
    """

    def __init__(self, type, blocknumber, blockhash, txhash, message):
        super().__init__(message)
        self.type = type
        self.blocknumber = blocknumber
        self.blockhash = blockhash
        self.txhash = txhash
        self.message = message


class NotAllTransactionsFetched(Exception):
    """
    Exception raised

    Attributes:
        message -- error message
    """

    def __init__(self, message):
        super().__init__(message)


class EntityMissingRequiredFieldError(Exception):
    """
    Exception raised for errors when processing transactions and a non-nullable field on a created entity is set to null.

    Attributes:
        type -- One of 'user', 'user_replica_set', 'user_library', 'tracks', 'social_features', 'playlists'
        cursed_record -- record number of error
        blockhash -- block hash of error
        txhash -- transaction hash of error
        message -- error message
    """

    def __init__(self, type, cursed_record, message):
        super().__init__(message)
        self.type = type
        self.blocknumber = cursed_record.blocknumber
        self.blockhash = cursed_record.blockhash
        self.txhash = cursed_record.txhash
