import datetime
import json
import logging

# pylint: disable=no-name-in-module
from eth_account.messages import encode_defunct
from flask import jsonify
from web3 import Web3
from web3.auto import w3

from src.queries.get_health import get_latest_chain_block_set_if_nx
from src.queries.get_sol_plays import get_sol_play_health_info

# pylint: disable=R0401
from src.utils import helpers, web3_provider
from src.utils.config import shared_config
from src.utils.redis_connection import get_redis
from src.utils.redis_constants import most_recent_indexed_block_redis_key

redis_conn = get_redis()
web3_connection = web3_provider.get_web3()
logger = logging.getLogger(__name__)
disc_prov_version = helpers.get_discovery_provider_version()


# Subclass JSONEncoder
class DateTimeEncoder(json.JSONEncoder):
    # Override the default method
    def default(self, o):  # pylint: disable=E0202
        if isinstance(o, (datetime.date, datetime.datetime)):
            # the Z is required in JS date format
            return o.isoformat() + "Z"
        return json.JSONEncoder.default(self, o)


def error_response(error, error_code=500):
    return jsonify({"success": False, "error": error}), error_code


# Create a response dict with metadata, data, signature, and timestamp
def success_response(
    response_entity=None, status=200, to_json=True, sign_response=True, extras={}
):
    starting_response_dictionary = {"data": response_entity, **extras}
    response_dictionary = response_dict_with_metadata(
        starting_response_dictionary, sign_response
    )
    response = jsonify(response_dictionary) if to_json else response_dictionary
    return response, status


# Create a response dict with metadata fields of success, latest_indexed_block, latest_chain_block,
# version, and owner_wallet
def response_dict_with_metadata(response_dictionary, sign_response):
    response_dictionary["success"] = True

    # Include block difference information
    latest_indexed_block = redis_conn.get(most_recent_indexed_block_redis_key)
    latest_chain_block, _ = get_latest_chain_block_set_if_nx(
        redis_conn, web3_connection
    )
    response_dictionary["latest_indexed_block"] = (
        int(latest_indexed_block) if latest_indexed_block else None
    )
    response_dictionary["latest_chain_block"] = (
        int(latest_chain_block) if latest_chain_block else None
    )

    # Include plays slot difference information
    play_info = get_sol_play_health_info(redis_conn, datetime.datetime.utcnow())
    play_db_tx = play_info["tx_info"]["db_tx"]
    play_chain_tx = play_info["tx_info"]["chain_tx"]
    response_dictionary["latest_indexed_slot_plays"] = (
        play_db_tx["slot"] if play_db_tx else None
    )
    response_dictionary["latest_chain_slot_plays"] = (
        play_chain_tx["slot"] if play_chain_tx else None
    )

    response_dictionary["version"] = disc_prov_version
    response_dictionary["signer"] = shared_config["delegate"]["owner_wallet"]

    if sign_response:
        # generate timestamp with format HH:MM:SS.sssZ
        timestamp = datetime.datetime.now().isoformat(timespec="milliseconds") + "Z"
        response_dictionary["timestamp"] = timestamp

        signature = generate_signature(response_dictionary)
        response_dictionary["signature"] = signature

    return response_dictionary


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


# Accepts raw data with timestamp key and relevant fields, converts data to hash, and recovers the wallet
def recover_wallet(data, signature):
    json_dump = json.dumps(
        data,
        sort_keys=True,
        ensure_ascii=False,
        separators=(",", ":"),
        cls=DateTimeEncoder,
    )

    # generate hash for if data contains unicode chars
    to_recover_hash = Web3.keccak(text=json_dump).hex()

    encoded_to_recover = encode_defunct(hexstr=to_recover_hash)
    recovered_wallet = w3.eth.account.recover_message(
        encoded_to_recover, signature=signature
    )

    return recovered_wallet
