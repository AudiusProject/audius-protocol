import json
from datetime import datetime
from typing import TypedDict, cast

from eth_account.messages import encode_defunct
from src.premium_content.types import PremiumContentType
from src.utils.config import shared_config
from web3 import Web3
from web3.auto import w3


class PremiumContentSignatureData(TypedDict):
    premium_content_id: int
    premium_content_type: PremiumContentType
    user_wallet: str
    timestamp: int


class PremiumContentSignatureArgs(TypedDict):
    id: int
    type: PremiumContentType
    user_wallet: str


class PremiumContentSignature(TypedDict):
    data: PremiumContentSignatureData
    signature: str


def _get_current_utc_timestamp_ms():
    return int(datetime.utcnow().timestamp() * 1000)


def get_premium_content_signature(
    args: PremiumContentSignatureArgs,
) -> PremiumContentSignature:
    data: PremiumContentSignatureData = {
        "premium_content_id": args["id"],
        "premium_content_type": args["type"],
        "user_wallet": args["user_wallet"],
        "timestamp": _get_current_utc_timestamp_ms(),
    }
    signature = generate_signature(data)
    return {"data": cast(PremiumContentSignatureData, data), "signature": signature}


# Subclass JSONEncoder
class DateTimeEncoder(json.JSONEncoder):
    # Override the default method
    def default(self, o):  # pylint: disable=E0202
        if isinstance(o, (datetime.date, datetime.datetime)):
            # the Z is required in JS date format
            return o.isoformat() + " Z"
        return json.JSONEncoder.default(self, o)


# Generate signature and timestamp using data
def generate_signature(data):
    # convert sorted dictionary to string with no white spaces
    to_sign_str = json.dumps(
        data,
        sort_keys=True,
        ensure_ascii=False,
        separators=(",", ":"),
        cls=DateTimeEncoder,
    )

    # generate hash for if data contains unicode chars
    to_sign_hash = Web3.keccak(text=to_sign_str).hex()

    # generate SignableMessage for sign_message()
    encoded_to_sign = encode_defunct(hexstr=to_sign_hash)

    # sign to get signature
    signed_message = w3.eth.account.sign_message(
        encoded_to_sign, private_key=shared_config["delegate"]["private_key"]
    )
    return signed_message.signature.hex()
