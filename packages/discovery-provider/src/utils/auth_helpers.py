import base64
import time

import requests
from eth_account.messages import encode_defunct
from web3 import Web3
from web3.auto import w3

basic_prefix = "Basic "
dev_mode = "dev:mode"


# From https://github.com/AudiusProject/sig/blob/main/python/index.py
def sign(input, private_key):
    to_sign_hash = Web3.keccak(text=input).hex()
    encoded_to_sign = encode_defunct(hexstr=to_sign_hash)
    signed_message = w3.eth.account.sign_message(
        encoded_to_sign, private_key=private_key
    )
    return signed_message.signature


def basic_auth_nonce(private_key):
    # Current time in ms
    timestamp = str(round(time.time() * 1000))
    signature = sign(timestamp, private_key)
    nonce = f"{timestamp}:{signature.hex()}"
    encoded_nonce = base64.b64encode(nonce.encode("utf-8")).decode("utf-8")
    return f"Basic {encoded_nonce}"


def signed_get(endpoint, private_key):
    headers = {"Authorization": basic_auth_nonce(private_key)}
    return requests.get(endpoint, headers=headers)


def decode_basic_auth(key: str) -> str:
    # check prefix first
    isbasic = key.startswith(basic_prefix)
    if not isbasic:
        raise Exception("auth decode: key did not contain 'Basic ' prefix")
    key = key.removeprefix(basic_prefix)

    decoded_bytes = base64.b64decode(key)
    decoded_str = decoded_bytes.decode("utf-8")

    if decoded_str is dev_mode:
        return dev_mode

    timestamp, signature_hex = decoded_str.split(":")
    signature = bytes.fromhex(signature_hex[2:])

    to_sign_hash = Web3.keccak(text=timestamp).hex()
    message = encode_defunct(hexstr=to_sign_hash)
    recovered_wallet = w3.eth.account.recover_message(message, signature=signature)

    return recovered_wallet
