import logging
import json
import datetime

from web3 import Web3
from web3.auto import w3
from eth_account.messages import encode_defunct
from hexbytes import HexBytes

from flask import jsonify
import redis
from src.utils.config import shared_config
from src.utils.redis_constants import latest_block_redis_key, most_recent_indexed_block_redis_key

import time
redis_url = shared_config["redis"]["url"]
redis = redis.Redis.from_url(url=redis_url)

logger = logging.getLogger(__name__)

def error_response(error, error_code=500):
    return jsonify({'success': False, 'error': error}), error_code

def success_response(response_entity=None, status=200):
    response_dictionary = success_response_dict(response_entity)
    return jsonify(response_dictionary), status

def success_response_with_signature(response_entity=None, status=200):
    # get data to sign
    data = {
        'data': response_entity
    }

    # generate timestamp
    timestamp = datetime.datetime.now().strftime('%Y-%m-%dT%H:%M:%S.%f Z')

    # combine timestamp and data to sign
    to_sign = {"timestamp": timestamp, **data}
    to_sign_str = json.dumps(to_sign, sort_keys=True, ensure_ascii=False, separators=(',', ':'))
    
    # generate hash for if data contains unicode chars
    to_sign_hash = Web3.keccak(text=to_sign_str).hex()
    
    # generate SignableMessage for sign_message()
    encoded_to_sign = encode_defunct(hexstr=to_sign_hash)

    # sign to get signature
    signed_message = w3.eth.account.sign_message(encoded_to_sign, private_key=shared_config['delegate']['private_key'])

    # add signature and timestamp to response
    response_dictionary = success_response_dict(response_entity)
    response_dictionary['timestamp'] = timestamp
    jsonified_signature = signed_message.signature.hex()
    response_dictionary['signature'] = jsonified_signature

    return jsonify(response_dictionary), status
    
def success_response_dict(response_entity=None):
    response_dictionary = {
        'data': response_entity
    }

    response_dictionary['success'] = True

    latest_indexed_block = redis.get(most_recent_indexed_block_redis_key)
    latest_chain_block = redis.get(latest_block_redis_key)

    response_dictionary['latest_indexed_block'] = (int(latest_indexed_block) if latest_indexed_block else None)
    response_dictionary['latest_chain_block'] = (int(latest_chain_block) if latest_chain_block else None)

    return response_dictionary
