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

    latest_indexed_block = redis.get(most_recent_indexed_block_redis_key)
    latest_chain_block = redis.get(latest_block_redis_key)

    response_dictionary['latest_indexed_block'] = (int(latest_indexed_block) if latest_indexed_block else None)
    response_dictionary['latest_chain_block'] = (int(latest_chain_block) if latest_chain_block else None)

    return jsonify(response_dictionary), status
