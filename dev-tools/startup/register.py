#!/usr/bin/env python3

import argparse
import json
import os
import pathlib

import web3

# Uses folder mounted at /tmp/eth-contracts/ABIs, assuming the path of this script is /tmp/dev-tools/startup/register.py
ETH_CONTRACTS_ABI_DIR = pathlib.Path(__file__).parent / "../../eth-contracts/ABIs"


def main(replica):
    delegateOwnerWallet = os.getenv(f"CN{replica}_SP_OWNER_ADDRESS")
    w3 = web3.Web3(web3.Web3.HTTPProvider(os.getenv("web3EthProviderUrl")))
    w3.eth.default_account = delegateOwnerWallet

    registry = w3.eth.contract(
        address=os.getenv("ETH_REGISTRY_ADDRESS"),
        abi=json.loads((ETH_CONTRACTS_ABI_DIR / "Registry.json").read_text())["abi"],
    )

    serviceProviderFactory = w3.eth.contract(
        address=registry.functions.getContract(
            b"ServiceProviderFactory".ljust(32, b"\0")
        ).call(),
        abi=json.loads(
            (ETH_CONTRACTS_ABI_DIR / "ServiceProviderFactory.json").read_text()
        )["abi"],
    )

    staking = w3.eth.contract(
        address=registry.functions.getContract(b"StakingProxy".ljust(32, b"\0")).call(),
        abi=json.loads((ETH_CONTRACTS_ABI_DIR / "Staking.json").read_text())["abi"],
    )

    token = w3.eth.contract(
        address=os.getenv("ETH_TOKEN_ADDRESS"),
        abi=json.loads((ETH_CONTRACTS_ABI_DIR / "ERC20Detailed.json").read_text())[
            "abi"
        ],
    )

    token.functions.approve(
        staking.address,
        200000 * (10 ** token.functions.decimals().call()),
    ).transact()

    try:
        serviceProviderFactory.functions.register(
            b"content-node".ljust(32, b"\0"),
            f"http://audius-protocol-creator-node-{replica}",
            200000 * (10 ** token.functions.decimals().call()),
            delegateOwnerWallet,
        ).transact()
    except web3.exceptions.ContractLogicError as e:
        if "revert ServiceProviderFactory: Endpoint already registered" in str(e):
            print(
                "The endpoint is already registered. This is fine and means the creator-node container is already running"
            )
        else:
            raise e


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Pass replica variable")
    parser.add_argument("replica", type=str, help="Content Node replica number")
    args = parser.parse_args()
    main(args.replica)
