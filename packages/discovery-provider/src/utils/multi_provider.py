import random

from web3.providers import BaseProvider, HTTPProvider


class MultiProvider(BaseProvider):
    """
    Implements a custom web3 provider

    ref: https://web3py.readthedocs.io/en/stable/internals.html#writing-your-own-provider
    """

    def __init__(self, providers):
        self.providers = [HTTPProvider(provider) for provider in providers.split(",")]

    def make_request(self, method, params):
        last_exception = None
        for provider in random.sample(self.providers, k=len(self.providers)):
            try:
                return provider.make_request(method, params)
            except Exception as e:
                last_exception = e
                continue
        raise (
            last_exception if last_exception else Exception("No RPC providers found")
        )

    def isConnected(self):
        return any(provider.isConnected() for provider in self.providers)

    def __str__(self):
        return f"MultiProvider({self.providers})"
