import json
from datetime import datetime
from time import sleep
from unittest.mock import patch

import flask
from dateutil import parser

from src.utils.redis_cache import (
    cache,
    get_all_json_cached_key,
    get_json_cached_key,
    set_json_cached_key,
)


def test_json_cache_single_key(redis_mock):
    """Test that values may be set and fetched from the redis cache"""
    set_json_cached_key(redis_mock, "key", {"name": "joe", "favorite_band": "Pink"})
    assert get_json_cached_key(redis_mock, "key") == {
        "name": "joe",
        "favorite_band": "Pink",
    }


def test_json_cache_multiple_keys(redis_mock):
    set_json_cached_key(redis_mock, "key1", {"name": "captain america"})
    set_json_cached_key(redis_mock, "key2", {"name": "thor"})
    set_json_cached_key(redis_mock, "key3", {"name": "iron man"})
    set_json_cached_key(redis_mock, "key4", {"name": "hulk"})
    # skip key5, which should report None
    set_json_cached_key(redis_mock, "key6", {"name": "hawkeye"})
    redis_mock.set("key7", "cannot_serialize")
    set_json_cached_key(redis_mock, "key8", {"name": "spiderman"})
    results = get_all_json_cached_key(
        redis_mock, ["key1", "key2", "key3", "key4", "key5", "key6", "key7", "key8"]
    )
    assert results == [
        {"name": "captain america"},
        {"name": "thor"},
        {"name": "iron man"},
        {"name": "hulk"},
        None,
        {"name": "hawkeye"},
        None,
        {"name": "spiderman"},
    ]


def test_json_cache_date_value(redis_mock):
    date = datetime(2016, 2, 18, 9, 50, 20)
    set_json_cached_key(redis_mock, "key", {"date": date})
    result = get_json_cached_key(redis_mock, "key")
    assert parser.parse(result["date"]) == date


def test_cache_decorator(redis_mock):
    """Test that the redis cache decorator works"""

    @patch("src.utils.redis_cache.extract_key")
    def get_mock_cache(extract_key):
        # cache requires a request object
        app = flask.Flask(__name__)
        with app.test_request_context("/"):
            mock_key_1 = "mock_key"
            extract_key.return_value = mock_key_1

            # Test a mock function returning two items
            @cache(ttl_sec=1)
            def mock_func():
                return {"name": "joe"}, 200

            res = mock_func()
            assert res[0] == {"name": "joe"}
            assert res[1] == 200

            cached_resp = redis_mock.get(mock_key_1)
            deserialized = json.loads(cached_resp)
            assert deserialized == {"name": "joe"}

            # This should call the function and return the cached response
            res = mock_func()
            assert res[0] == {"name": "joe"}
            assert res[1] == 200

            # Sleep to wait for the cache to expire
            sleep(1)

            cached_resp = redis_mock.get(mock_key_1)
            assert cached_resp is None

            # Test the single response
            def transform(input):
                return {"music": input}

            @cache(ttl_sec=1, transform=transform)
            def mock_func_transform():
                return "audius"

            res = mock_func_transform()
            assert res == {"music": "audius"}

            cached_resp = redis_mock.get(mock_key_1)
            deserialized = json.loads(cached_resp)
            assert deserialized == "audius"

            # This should call the function and return the cached response
            res = mock_func_transform()
            assert res == {"music": "audius"}

            # Sleep to wait for the cache to expire
            sleep(1)

            cached_resp = redis_mock.get(mock_key_1)
            assert cached_resp is None

    get_mock_cache()  # pylint: disable=no-value-for-parameter
