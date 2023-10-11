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
    print("REED main", flush=True)
    w3 = web3.Web3(web3.Web3.HTTPProvider(os.getenv("audius_web3_eth_provider_url")))
    print("REED 1", flush=True)
    w3.strict_bytes_type_checking = False

    w3.eth.default_account = os.getenv("audius_delegate_owner_wallet")
    print("REED 2", flush=True)

    registry = w3.eth.contract(
        address=os.getenv("audius_eth_contracts_registry"),
        abi=json.loads((ETH_CONTRACTS_ABI_DIR / "Registry.json").read_text())["abi"],
    )

    print("REED 3", flush=True)
    serviceProviderFactory = w3.eth.contract(
        address=registry.functions.getContract(b"ServiceProviderFactory").call(),
        abi=json.loads(
            (ETH_CONTRACTS_ABI_DIR / "ServiceProviderFactory.json").read_text()
        )["abi"],
    )

    print("REED 4", flush=True)
    staking = w3.eth.contract(
        address=registry.functions.getContract(b"StakingProxy").call(),
        abi=json.loads((ETH_CONTRACTS_ABI_DIR / "Staking.json").read_text())["abi"],
    )

    print("REED 5", flush=True)
    token = w3.eth.contract(
        address=os.getenv("audius_eth_contracts_token"),
        abi=json.loads((ETH_CONTRACTS_ABI_DIR / "ERC20Detailed.json").read_text())[
            "abi"
        ],
    )

    # Wait for health check to pass
    discprov_url = os.getenv("audius_discprov_url")
    print("REED discprov_url", discprov_url, flush=True)

    print("REED 6", flush=True)
    token.functions.approve(
        staking.address,
        200000 * (10 ** token.functions.decimals().call()),
    ).transact()

    print("REED 7", flush=True)
    serviceProviderFactory.functions.register(
        b"discovery-node",
        os.getenv("audius_discprov_url"),
        200000 * (10 ** token.functions.decimals().call()),
        os.getenv("audius_delegate_owner_wallet"),
    ).transact()
    print("REED END", flush=True)


if __name__ == "__main__":
    main()
