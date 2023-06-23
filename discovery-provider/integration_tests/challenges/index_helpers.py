# Helper methods for testing indexing


from src.challenges.challenge_event_bus import ChallengeEventBus


class AttrDict(dict):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.__dict__ = self


class UpdateTask:
    def __init__(
        self,
        web3,
        challenge_event_bus,
        redis=None,
        eth_manager=None,
        entity_manager_contract=None,
    ):
        self.web3 = web3
        self.challenge_event_bus: ChallengeEventBus = challenge_event_bus
        self.redis = redis
        self.eth_manager = eth_manager
        self.entity_manager_contract = entity_manager_contract
