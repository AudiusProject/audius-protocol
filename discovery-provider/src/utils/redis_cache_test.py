import pickle
from time import sleep
from unittest.mock import patch
import flask
from src.utils.redis_cache import cache


def test_cache(redis_mock):
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
            deserialized = pickle.loads(cached_resp)
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
            deserialized = pickle.loads(cached_resp)
            assert deserialized == "audius"

            # This should call the function and return the cached response
            res = mock_func_transform()
            assert res == {"music": "audius"}

            # Sleep to wait for the cache to expire
            sleep(1)

            cached_resp = redis_mock.get(mock_key_1)
            assert cached_resp is None

    get_mock_cache()  # pylint: disable=no-value-for-parameter
