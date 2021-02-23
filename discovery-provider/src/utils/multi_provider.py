import random
import web3


class MultiProvider(web3.providers.BaseProvider):
    def __init__(self, providers):
        self.providers = providers

    def make_request(self, method, params):
        for provider in random.sample(self.providers, k=len(self.providers)):
            try:
                return provider.make_request(method, params)
            except Exception:
                continue
        raise Exception("All requests failed")

    def isConnected(self):
        return all(provider.isConnected() for provider in self.providers)
