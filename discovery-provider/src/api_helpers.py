from flask import jsonify
import redis
from src.utils.config import shared_config
from src.utils.helpers import latest_block_redis_key, most_recent_indexed_block_redis_key


redis_url = shared_config["redis"]["url"]
redis = redis.Redis.from_url(url=redis_url)


def error_response(error, error_code=500):
    return jsonify({'success': False, 'error': error}), error_code


def success_response(response_entity=None, status=200):
    response_dictionary = {
        'data': response_entity
    }

    response_dictionary['success'] = True
    response_dictionary['latest_indexed_block'] = int(redis.get(most_recent_indexed_block_redis_key))
    response_dictionary['latest_chain_block'] = int(redis.get(latest_block_redis_key))
    return jsonify(response_dictionary), status
