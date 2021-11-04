from celery import Task
from redis import Redis
from src.challenges.challenge_event_bus import ChallengeEventBus
from src.utils.session_manager import SessionManager


class DatabaseTask(Task):
    def __init__(
        self,
        db=None,
        web3=None,
        abi_values=None,
        shared_config=None,
        ipfs_client=None,
        redis=None,
        eth_web3_provider=None,
        solana_client_manager=None,
        challenge_event_bus=None,
    ):
        self._db = db
        self._web3_provider = web3
        self._abi_values = abi_values
        self._shared_config = shared_config
        self._ipfs_client = ipfs_client
        self._redis = redis
        self._eth_web3_provider = eth_web3_provider
        self._solana_client_manager = solana_client_manager
        self._challenge_event_bus = challenge_event_bus

    @property
    def abi_values(self):
        return self._abi_values

    @property
    def web3(self):
        return self._web3_provider

    @property
    def db(self) -> SessionManager:
        return self._db

    @property
    def shared_config(self):
        return self._shared_config

    @property
    def ipfs_client(self):
        return self._ipfs_client

    @property
    def redis(self) -> Redis:
        return self._redis

    @property
    def eth_web3(self):
        return self._eth_web3_provider

    @property
    def solana_client_manager(self):
        return self._solana_client_manager

    @property
    def challenge_event_bus(self) -> ChallengeEventBus:
        return self._challenge_event_bus
