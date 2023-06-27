class Base(Exception):
    pass


class ArgumentError(Base):
    """Invalid arguments passed to request"""

    pass  # pylint: disable=W0107


class NotFoundError(Base):
    """Invalid arguments passed to request"""

    pass  # pylint: disable=W0107


class SolanaTransactionFetchError(Base):
    """Error while fetching solana transaction"""

    pass  # pylint: disable=W0107


class MissingEthRecipientError(Base):
    """Exception raised for missing eth recipient error while indexing
    Attributes:
        eth_recipient -- Eth Address
        challenge_id -- Challenge ID
        specifier -- Challenge specifier
        signature -- Solana tx signature
        slot -- Solana slot number
    """

    def __init__(
        self, eth_recipient, challenge_id, specifier, signature, slot, message
    ):
        super().__init__(message)
        self.eth_recipient = eth_recipient
        self.challenge_id = challenge_id
        self.specifier = specifier
        self.signature = signature
        self.slot = slot


class IndexingValidationError(Exception):
    pass
