#!/usr/bin/env python3

import json
import os
import pathlib
import subprocess
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


def run_bash_script(script_path, *args):
    try:
        # Construct the command, including the script and its arguments
        command = [script_path] + list(args)

        # Run the command using subprocess
        process = subprocess.Popen(
            command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True
        )

        # Wait for the script to complete
        stdout, stderr = process.communicate()

        # Check the return code to determine success or failure
        return_code = process.returncode

        if return_code == 0:
            # The script executed successfully
            return True, stdout
        else:
            # The script encountered an error
            return False, stderr
    except Exception as e:
        # Handle any exceptions, such as file not found
        return False, str(e)


# Example usage:
script_path = "/path/to/your/script.sh"
arguments = ["arg1", "arg2"]

success, output = run_bash_script(script_path, *arguments)

if success:
    print("Script executed successfully. Output:\n", output)
else:
    print("Script execution failed. Error:\n", output)


def main():
    w3 = web3.Web3(web3.Web3.HTTPProvider(os.getenv("audius_web3_eth_provider_url")))
    w3.strict_bytes_type_checking = False

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

    # Create rewards manager sender for this DN
    print("Creating rewards manager sender for this DN")
    run_bash_script(
        "audius-reward-manager-cli",
        "create-sender",
        "--eth-operator-address",
        os.getenv("DP1_DELEGATE_OWNER_ADDRESS"),
        "--eth-sender-address",
        os.getenv("DP1_DELEGATE_OWNER_ADDRESS"),
        "--reward-manager",
        "SOLANA_REWARD_MANAGER_PDA_PUBLIC_KEY",
    )
    print("Rewards manager sender created")


if __name__ == "__main__":
    main()
