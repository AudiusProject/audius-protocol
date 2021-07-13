from datetime import datetime, timedelta
from sqlalchemy import func
from src.models import RouteMetrics, AppNameMetrics
from src.tasks.index_metrics import (
    process_route_keys,
    process_app_name_keys,
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
        RouteMetrics.__table__.create(db_mock._engine)

        process_route_keys(session, redis_mock, key, ip, date)

        all_route_metrics = session.query(RouteMetrics).all()
        assert len(all_route_metrics) == 4

        user_search = (
            session.query(RouteMetrics)
            .filter(
                RouteMetrics.version == "1",
                RouteMetrics.route_path == "users/search",
                RouteMetrics.query_string == "query=ray",
                RouteMetrics.ip == "192.168.0.1",
                RouteMetrics.count == 3,
                RouteMetrics.timestamp == date,
            )
            .all()
        )
        assert len(user_search) == 1

        trending_tracks = (
            session.query(RouteMetrics)
            .filter(
                RouteMetrics.version == "1",
                RouteMetrics.route_path == "tracks/trending",
                RouteMetrics.query_string == "genre=rap&timeRange=week",
                RouteMetrics.ip == "192.168.0.1",
                RouteMetrics.count == 2,
                RouteMetrics.timestamp == date,
            )
            .all()
        )
        assert len(trending_tracks) == 1

        playlist_route = (
            session.query(RouteMetrics)
            .filter(
                RouteMetrics.version == "1",
                RouteMetrics.route_path == "playlists/hash",
                RouteMetrics.ip == "192.168.0.1",
                RouteMetrics.count == 1,
                RouteMetrics.timestamp == date,
            )
            .all()
        )

        assert len(playlist_route) == 1

        no_version_tracks = (
            session.query(RouteMetrics)
            .filter(
                RouteMetrics.version == "0",
                RouteMetrics.route_path == "tracks",
                RouteMetrics.ip == "192.168.0.1",
                RouteMetrics.count == 1,
                RouteMetrics.timestamp == date,
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
        AppNameMetrics.__table__.create(db_mock._engine)

        process_app_name_keys(session, redis_mock, key, ip, date)

        all_app_names = session.query(AppNameMetrics).all()
        assert len(all_app_names) == 2

        audilous_results = (
            session.query(AppNameMetrics)
            .filter(
                AppNameMetrics.application_name == "audilous",
                AppNameMetrics.ip == "192.168.0.1",
                AppNameMetrics.count == 22,
                AppNameMetrics.timestamp == date,
            )
            .all()
        )
        assert len(audilous_results) == 1

        music_corp_results = (
            session.query(AppNameMetrics)
            .filter(
                AppNameMetrics.application_name == "music_corp",
                AppNameMetrics.ip == "192.168.0.1",
                AppNameMetrics.count == 51,
                AppNameMetrics.timestamp == date,
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

    AppNameMetrics.__table__.create(db_mock._engine)
    sweep_metrics(db_mock, redis_mock)

    with db_mock.scoped_session() as session:

        all_app_names = session.query(
            func.count(AppNameMetrics.application_name.distinct())
        ).scalar()
        assert all_app_names == 1

        music_res = (
            session.query(AppNameMetrics)
            .filter(
                AppNameMetrics.application_name == "music",
                AppNameMetrics.ip == "192.168.0.1",
                AppNameMetrics.count == 1,
                AppNameMetrics.timestamp == before_date,
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
