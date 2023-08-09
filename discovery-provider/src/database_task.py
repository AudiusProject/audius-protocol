from celery import Task
from redis import Redis
from web3.contract import Contract

from src.challenges.challenge_event_bus import ChallengeEventBus
from src.utils.eth_manager import EthManager
from src.utils.session_manager import SessionManager


class DatabaseTask(Task):
    def __init__(
        self,
        db=None,
        db_read_replica=None,
        web3=None,
        abi_values=None,
        eth_abi_values=None,
        shared_config=None,
        redis=None,
        eth_web3_provider=None,
        trusted_notifier_manager=None,
        solana_client_manager=None,
        challenge_event_bus=None,
        eth_manager=None,
        entity_manager_contract=None,
    ):
        self._db = db
        self._db_read_replica = db_read_replica
        self._web3_provider = web3
        self._abi_values = abi_values
        self._eth_abi_values = eth_abi_values
        self._shared_config = shared_config
        self._redis = redis
        self._eth_web3_provider = eth_web3_provider
        self._trusted_notifier_manager = trusted_notifier_manager
        self._solana_client_manager = solana_client_manager
        self._challenge_event_bus = challenge_event_bus
        self._eth_manager = eth_manager
        self._entity_manager_contract = entity_manager_contract

    @property
    def abi_values(self):
        return self._abi_values

    @property
    def eth_abi_values(self):
        return self._eth_abi_values

    @property
    def web3(self):
        return self._web3_provider

    @property
    def db(self) -> SessionManager:
        return self._db

    @property
    def db_read_replica(self) -> SessionManager:
        return self._db_read_replica

    @property
    def shared_config(self):
        return self._shared_config

    @property
    def redis(self) -> Redis:
        return self._redis

    @property
    def eth_web3(self):
        return self._eth_web3_provider

    @property
    def trusted_notifier_manager(self):
        return self._trusted_notifier_manager

    @property
    def solana_client_manager(self):
        return self._solana_client_manager

    @property
    def challenge_event_bus(self) -> ChallengeEventBus:
        return self._challenge_event_bus

    @property
    def eth_manager(self) -> EthManager:
        return self._eth_manager

    @property
    def entity_manager_contract(self) -> Contract:
        return self._entity_manager_contract
