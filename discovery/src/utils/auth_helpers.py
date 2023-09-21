import base64
import time

import requests
from eth_account.messages import encode_defunct
from web3 import Web3
from web3.auto import w3


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
