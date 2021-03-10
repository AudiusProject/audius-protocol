import json
from datetime import datetime, timedelta
from src.utils.redis_metrics import personal_route_metrics, personal_app_metrics, \
    datetime_format_secondary, get_redis_metrics
from src.utils.helpers import redis_set_and_dump

now = datetime.utcnow()
old_time = now - timedelta(minutes=4)
recent_time_1 = now - timedelta(minutes=2)
recent_time_2 = now - timedelta(minutes=1)
start_time = int((now - timedelta(minutes=3)).timestamp())
start_time_obj = datetime.fromtimestamp(start_time)

def test_get_cached_route_metrics(redis_mock):
    metrics = {
        old_time.strftime(datetime_format_secondary): {
            'some-ip': 1,
            'other-ip': 2
        },
        recent_time_1.strftime(datetime_format_secondary): {
            'another-ip': 1,
            'some-other-ip': 2
        },
        recent_time_2.strftime(datetime_format_secondary): {
            '1.2.3.4': 1,
            'some-ip': 2,
            'another-ip': 3
        }
    }
    redis_set_and_dump(redis_mock, personal_route_metrics, json.dumps(metrics))

    result = get_redis_metrics(redis_mock, start_time_obj, personal_route_metrics)

    assert len(result.items()) == 4
    assert result['another-ip'] == 4
    assert result['some-other-ip'] == 2
    assert result['1.2.3.4'] == 1
    assert result['some-ip'] == 2

def test_get_cached_app_metrics(redis_mock):
    metrics = {
        old_time.strftime(datetime_format_secondary): {
            'some-app': 1,
            'other-app': 2
        },
        recent_time_1.strftime(datetime_format_secondary): {
            'another-app': 1,
            'some-other-app': 2
        },
        recent_time_2.strftime(datetime_format_secondary): {
            'top-app': 1,
            'some-app': 2,
            'another-app': 3
        }
    }
    redis_set_and_dump(redis_mock, personal_app_metrics, json.dumps(metrics))

    result = get_redis_metrics(redis_mock, start_time_obj, personal_app_metrics)

    assert len(result.items()) == 4
    assert result['another-app'] == 4
    assert result['some-other-app'] == 2
    assert result['top-app'] == 1
    assert result['some-app'] == 2
