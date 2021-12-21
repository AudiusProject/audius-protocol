from datetime import datetime, timedelta
from src.models import AppNameMetrics, RouteMetrics
from src.queries.get_app_names import get_app_names


def test_get_app_names(db_mock):
    """Tests that get_app_names returns the app names"""

    date = datetime(2020, 10, 4, 10, 35, 0)
    before_date = date + timedelta(hours=-1)

    app_names = [
        {"application_name": "joe", "count": 3, "timestamp": date},
        {"application_name": "mike", "count": 2, "timestamp": date},
        {"application_name": "ray", "count": 2, "timestamp": date},
    ]

    route_metrics = [
        {
            "version": "1",
            "route_path": "tracks/some_hash",
            "query_string": "",
            "ip": "192.168.0.1",
            "count": 20,
            "timestamp": date,
        }
    ]

    AppNameMetrics.__table__.create(db_mock._engine)
    RouteMetrics.__table__.create(db_mock._engine)

    # Set up db state
    with db_mock.scoped_session() as session:
        app_names = [
            AppNameMetrics(
                application_name=metric["application_name"],
                count=metric["count"],
                timestamp=metric["timestamp"],
            )
            for metric in app_names
        ]
        route_metrics = [
            RouteMetrics(
                version=metric["version"],
                route_path=metric["route_path"],
                query_string=metric["query_string"],
                ip=metric["ip"],
                count=metric["count"],
                timestamp=metric["timestamp"],
            )
            for metric in route_metrics
        ]

        session.bulk_save_objects(app_names)
        session.bulk_save_objects(route_metrics)

    args = {
        "start_time": before_date,
        "limit": 10,
        "offset": 0,
        "include_unknown": True,
    }
    app_names = get_app_names(args)

    assert len(app_names) == 4

    assert app_names[0]["name"] == "unknown"
    assert app_names[0]["count"] == 13
    assert app_names[1]["name"] == "joe"
    assert app_names[1]["count"] == 3
    assert app_names[2]["name"] == "mike"
    assert app_names[2]["count"] == 2
    assert app_names[3]["name"] == "ray"
    assert app_names[3]["count"] == 2
