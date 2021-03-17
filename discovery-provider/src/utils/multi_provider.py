import random
from web3.providers import HTTPProvider, BaseProvider


class MultiProvider(BaseProvider):
    def __init__(self, providers):
        self.providers = [HTTPProvider(provider) for provider in providers.split(",")]

    def make_request(self, method, params):
        for provider in random.sample(self.providers, k=len(self.providers)):
            try:
                return provider.make_request(method, params)
            except Exception:
                continue
        raise Exception("All requests failed")

    def isConnected(self):
        return any(provider.isConnected() for provider in self.providers)

    def __str__(self):
        return "MultiProvider({})".format(self.providers)
