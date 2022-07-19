#!/usr/bin/env python3

import json
import os
import pathlib
import time
import urllib.parse
import urllib.request

import web3

ETH_CONTRACTS_ABI_DIR = pathlib.Path(__file__).parent / "../build/eth-contracts"


def health_check(discprov_url):
    url = urllib.parse.urljoin(discprov_url, "/health_check")

    try:
        response = json.load(urllib.request.urlopen(url))
        return (
            response["data"]["block_difference"]
            < response["data"]["maximum_healthy_block_difference"]
        )
    except (ConnectionError, urllib.error.URLError, json.JSONDecodeError):
        return False


def main():
    w3 = web3.Web3(web3.Web3.HTTPProvider(os.getenv("audius_web3_eth_provider_url")))
    w3.eth.default_account = os.getenv("audius_delegate_owner_wallet")

    registry = w3.eth.contract(
        address=os.getenv("audius_eth_contracts_registry"),
        abi=json.loads((ETH_CONTRACTS_ABI_DIR / "Registry.json").read_text())["abi"],
    )

    serviceProviderFactory = w3.eth.contract(
        address=registry.functions.getContract(b"ServiceProviderFactory").call(),
        abi=json.loads(
            (ETH_CONTRACTS_ABI_DIR / "ServiceProviderFactory.json").read_text()
        )["abi"],
    )

    staking = w3.eth.contract(
        address=registry.functions.getContract(b"StakingProxy").call(),
        abi=json.loads((ETH_CONTRACTS_ABI_DIR / "Staking.json").read_text())["abi"],
    )

    token = w3.eth.contract(
        address=os.getenv("audius_eth_contracts_token"),
        abi=json.loads((ETH_CONTRACTS_ABI_DIR / "ERC20Detailed.json").read_text())[
            "abi"
        ],
    )

    # Wait for health check to pass
    discprov_url = os.getenv("audius_discprov_url")
    while not health_check(discprov_url):
        time.sleep(1)

    token.functions.approve(
        staking.address,
        200000 * (10 ** token.functions.decimals().call()),
    ).transact()

    serviceProviderFactory.functions.register(
        b"discovery-node",
        os.getenv("audius_discprov_url"),
        200000 * (10 ** token.functions.decimals().call()),
        os.getenv("audius_delegate_owner_wallet"),
    ).transact()


if __name__ == "__main__":
    main()
