from datetime import datetime, timedelta

from sqlalchemy import func
from src.models.metrics.app_name_metrics import AppNameMetric
from src.models.metrics.route_metrics import RouteMetric
from src.tasks.index_metrics import (
    process_app_name_keys,
    process_route_keys,
    sweep_metrics,
)
from src.utils.redis_metrics import datetime_format


def test_process_route_keys(redis_mock, db_mock):
    """Tests that a redis hash is parsed correctly to generate db rows and delete the redis key"""

    routes = {
        "/v1/users/search?query=ray": "3",
        "/v1/tracks/trending?genre=rap&timeRange=week": "2",
        "/v1/playlists/hash": "1",
        "/tracks": "1",
    }

    key = "API_METRICS:routes:192.168.0.1:2020/08/06:19"

    ip = "192.168.0.1"

    redis_mock.hmset(key, routes)

    date = datetime.utcnow()

    with db_mock.scoped_session() as session:
        RouteMetric.__table__.create(db_mock._engine)

        process_route_keys(session, redis_mock, key, ip, date)

        all_route_metrics = session.query(RouteMetric).all()
        assert len(all_route_metrics) == 4

        user_search = (
            session.query(RouteMetric)
            .filter(
                RouteMetric.version == "1",
                RouteMetric.route_path == "users/search",
                RouteMetric.query_string == "query=ray",
                RouteMetric.ip == "192.168.0.1",
                RouteMetric.count == 3,
                RouteMetric.timestamp == date,
            )
            .all()
        )
        assert len(user_search) == 1

        trending_tracks = (
            session.query(RouteMetric)
            .filter(
                RouteMetric.version == "1",
                RouteMetric.route_path == "tracks/trending",
                RouteMetric.query_string == "genre=rap&timeRange=week",
                RouteMetric.ip == "192.168.0.1",
                RouteMetric.count == 2,
                RouteMetric.timestamp == date,
            )
            .all()
        )
        assert len(trending_tracks) == 1

        playlist_route = (
            session.query(RouteMetric)
            .filter(
                RouteMetric.version == "1",
                RouteMetric.route_path == "playlists/hash",
                RouteMetric.ip == "192.168.0.1",
                RouteMetric.count == 1,
                RouteMetric.timestamp == date,
            )
            .all()
        )

        assert len(playlist_route) == 1

        no_version_tracks = (
            session.query(RouteMetric)
            .filter(
                RouteMetric.version == "0",
                RouteMetric.route_path == "tracks",
                RouteMetric.ip == "192.168.0.1",
                RouteMetric.count == 1,
                RouteMetric.timestamp == date,
            )
            .all()
        )

        assert len(no_version_tracks) == 1

    keys = redis_mock.keys(key)
    assert not keys


def test_process_app_name_keys(redis_mock, db_mock):
    """Test that the app name redis hash is parsed correctly to generate db rows"""

    app_names = {"audilous": "22", "music_corp": "51"}

    key = "API_METRICS:applications:192.168.0.1:2020/08/06:19"

    ip = "192.168.0.1"

    redis_mock.hmset(key, app_names)

    date = datetime.utcnow()

    with db_mock.scoped_session() as session:
        AppNameMetric.__table__.create(db_mock._engine)

        process_app_name_keys(session, redis_mock, key, ip, date)

        all_app_names = session.query(AppNameMetric).all()
        assert len(all_app_names) == 2

        audilous_results = (
            session.query(AppNameMetric)
            .filter(
                AppNameMetric.application_name == "audilous",
                AppNameMetric.ip == "192.168.0.1",
                AppNameMetric.count == 22,
                AppNameMetric.timestamp == date,
            )
            .all()
        )
        assert len(audilous_results) == 1

        music_corp_results = (
            session.query(AppNameMetric)
            .filter(
                AppNameMetric.application_name == "music_corp",
                AppNameMetric.ip == "192.168.0.1",
                AppNameMetric.count == 51,
                AppNameMetric.timestamp == date,
            )
            .all()
        )
        assert len(music_corp_results) == 1

    keys = redis_mock.keys(key)
    assert not keys


def test_sweep_metrics(redis_mock, db_mock):
    """Test that the app name redis hash is parsed correctly to generate db rows"""

    app_names = {"music": "1"}

    date = datetime.utcnow().replace(minute=0, second=0, microsecond=0)
    before_date = date + timedelta(hours=-1)
    after_date = date + timedelta(hours=1)

    ip = "192.168.0.1"
    current = date.strftime(datetime_format)
    before = before_date.strftime(datetime_format)
    after = after_date.strftime(datetime_format)

    currentKey = f"API_METRICS:applications:{ip}:{current}"
    beforeKey = f"API_METRICS:applications:{ip}:{before}"
    afterKey = f"API_METRICS:applications:{ip}:{after}"

    redis_mock.hmset(currentKey, app_names)
    redis_mock.hmset(beforeKey, app_names)
    redis_mock.hmset(afterKey, app_names)

    keys = redis_mock.keys("API_METRICS:applications:*")
    key_strs = [key_byte.decode("utf-8") for key_byte in keys]

    assert len(keys) == 3
    assert currentKey in key_strs
    assert afterKey in key_strs

    AppNameMetric.__table__.create(db_mock._engine)
    sweep_metrics(db_mock, redis_mock)

    with db_mock.scoped_session() as session:

        all_app_names = session.query(
            func.count(AppNameMetric.application_name.distinct())
        ).scalar()
        assert all_app_names == 1

        music_res = (
            session.query(AppNameMetric)
            .filter(
                AppNameMetric.application_name == "music",
                AppNameMetric.ip == "192.168.0.1",
                AppNameMetric.count == 1,
                AppNameMetric.timestamp == before_date,
            )
            .all()
        )
        assert len(music_res) == 1

    # SHould be removed after the sweep
    keys = redis_mock.keys("API_METRICS:applications:*")
    key_strs = [key_byte.decode("utf-8") for key_byte in keys]

    assert len(keys) == 2
    assert currentKey in key_strs
    assert afterKey in key_strs
