from datetime import datetime, timedelta

from src.models.metrics.route_metrics import RouteMetric
from src.tasks.index_metrics import process_route_keys

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
