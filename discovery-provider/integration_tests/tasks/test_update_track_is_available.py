import logging
from unittest import mock

from integration_tests.utils import populate_mock_db
from src.models.tracks.track import Track
from src.tasks.update_track_is_available import (
    ALL_UNAVAILABLE_TRACKS_REDIS_KEY,
    _get_redis_set_members_as_list,
    check_track_is_available,
    fetch_unavailable_track_ids,
    fetch_unavailable_track_ids_in_network,
    get_unavailable_tracks_redis_key,
    query_registered_content_node_info,
    query_replica_set_by_track_id,
    query_tracks_by_track_ids,
    update_tracks_is_available_status,
)
from src.utils.db_session import get_db
from src.utils.redis_connection import get_redis

logger = logging.getLogger(__name__)


def _mock_response(json_data, status=200, raise_for_status=None):
    """Mock out request.get response"""
    mock_resp = mock.Mock()

    mock_resp.json = mock.Mock(return_value=json_data)
    mock_resp.status_code = status

    mock_resp.raise_for_status = mock.Mock()
    if raise_for_status:
        mock_resp.raise_for_status.side_effect = raise_for_status

    return mock_resp


def test_query_registered_content_node_info(app):
    with app.app_context():
        db = get_db()

    _seed_db_with_data(db)

    with db.scoped_session() as session:
        content_nodes = query_registered_content_node_info(session)
        print(content_nodes)

        for i, node in enumerate(content_nodes):
            assert node["endpoint"] == f"www.content_node{i}.com"
            assert node["spID"] == i + 1


@mock.patch("src.tasks.update_track_is_available.query_registered_content_node_info")
@mock.patch("src.tasks.update_track_is_available.fetch_unavailable_track_ids")
def test_fetch_unavailable_track_ids_in_network(
    mock_fetch_unavailable_track_ids, mock_query_registered_content_node_info, app
):
    # Setup
    mock_query_registered_content_node_info.return_value = [
        {
            "endpoint": "http://content_node.com",
            "spID": 1,
        },
        {
            "endpoint": "http://content_node2.com",
            "spID": 2,
        },
    ]

    spID_1_unavailable_tracks = [1, 2, 3, 4]
    spID_2_unavailable_tracks = [4, 5, 6, 7]
    mock_fetch_unavailable_track_ids.side_effect = [
        spID_1_unavailable_tracks,
        spID_2_unavailable_tracks,
    ]

    with app.app_context():
        redis = get_redis()
        db = get_db()

    with db.scoped_session() as session:
        fetch_unavailable_track_ids_in_network(session, redis)

    # Check that redis adds track ids as expected

    spID_1_unavailable_tracks_redis = set(
        _get_redis_set_members_as_list(redis, get_unavailable_tracks_redis_key(1))
    )
    for id in spID_1_unavailable_tracks:
        assert id in spID_1_unavailable_tracks_redis

    spID_2_unavailable_tracks_redis = set(
        _get_redis_set_members_as_list(redis, get_unavailable_tracks_redis_key(2))
    )
    for id in spID_2_unavailable_tracks:
        assert id in spID_2_unavailable_tracks_redis

    all_unavailable_tracks_redis = set(
        _get_redis_set_members_as_list(redis, ALL_UNAVAILABLE_TRACKS_REDIS_KEY)
    )
    for id in [*spID_1_unavailable_tracks, *spID_2_unavailable_tracks]:
        assert id in all_unavailable_tracks_redis


@mock.patch("src.tasks.update_track_is_available.requests")
def test_fetch_unavailable_track_ids(mock_requests, app):
    """
    Test fetching unavailable track ids from Content Node
    mock_get: reference to the mock requests.get
    look at test_index_tracks.py for ref
    """
    track_ids = [1, 2, 3, 4, 5, 6, 7]
    mock_return = {
        "data": {"values": track_ids},
        "signer": "signer",
        "timestamp": "2022-05-19T19:50:56.630Z",
        "signature": "signature",
    }

    mock_requests.get.return_value = _mock_response(mock_return, mock_return)

    fetch_response = fetch_unavailable_track_ids("http://content_node.com")

    assert fetch_response == track_ids


@mock.patch("src.tasks.update_track_is_available.check_track_is_available")
def test_update_tracks_is_available_status(mock_check_track_is_available, app):
    with app.app_context():
        db = get_db()
        redis = get_redis()

    # Setup
    mock_unavailable_tracks = [1, 2, 3, 4, 5, 6, 7]
    _seed_db_with_data(db)
    redis.sadd(ALL_UNAVAILABLE_TRACKS_REDIS_KEY, *mock_unavailable_tracks)
    mock_check_track_is_available.return_value = False

    update_tracks_is_available_status(db, redis)

    with db.scoped_session() as session:
        tracks = (
            session.query(Track.track_id, Track.is_available)
            .filter(
                Track.track_id.in_(mock_unavailable_tracks), Track.is_current == True
            )
            .all()
        )

        # Check that the 'is_available' value is False
        for track in tracks:
            assert track[1] == False

        mock_available_tracks = [8, 9, 10]
        tracks = (
            session.query(Track.track_id, Track.is_available)
            .filter(Track.track_id.in_(mock_available_tracks), Track.is_current == True)
            .all()
        )

        # Check that the 'is_available' value is True
        for track in tracks:
            assert track[1] == True


def test_query_replica_set_by_track_id(app):
    """Test that the query returns a mapping of track id, user id, and replica set"""

    with app.app_context():
        db = get_db()

    expected_query_results = _seed_db_with_data(db)

    with db.scoped_session() as session:
        track_ids = [1, 2, 3, 4, 5, 6, 7]
        sorted_actual_results = query_replica_set_by_track_id(session, track_ids)
        sorted_actual_results.sort(key=lambda entry: entry[0])

        assert len(sorted_actual_results) == len(track_ids)
        assert sorted_actual_results == expected_query_results


def test_check_track_is_available__return_is_not_available(app):
    with app.app_context():
        redis = get_redis()

    spID_2_key = get_unavailable_tracks_redis_key(2)
    spID_3_key = get_unavailable_tracks_redis_key(3)
    spID_4_key = get_unavailable_tracks_redis_key(4)

    # Seed redis some initialized data
    # (1, 2, [3, 4])
    redis.sadd(spID_2_key, 1)
    redis.sadd(spID_3_key, 1)
    redis.sadd(spID_4_key, 1)

    assert False == check_track_is_available(redis, 1, [2, 3, 4])


def test_check_track_is_available__return_is_available_1(app):
    with app.app_context():
        redis = get_redis()

    spID_2_key = get_unavailable_tracks_redis_key(2)
    spID_3_key = get_unavailable_tracks_redis_key(3)

    redis.sadd(spID_2_key, 1)
    redis.sadd(spID_3_key, 1)
    # Available on spID = 4

    assert True == check_track_is_available(redis, 1, [2, 3, 4])


def test_check_track_is_available__return_is_available_2(app):
    with app.app_context():
        redis = get_redis()

    spID_2_key = get_unavailable_tracks_redis_key(2)

    redis.sadd(spID_2_key, 1)
    # Available on spID = 3
    # Available on spID = 4

    assert True == check_track_is_available(redis, 1, [2, 3, 4])


def test_check_track_is_available__return_is_available_3(app):
    with app.app_context():
        redis = get_redis()

    # Available on spID = 2
    # Available on spID = 3
    # Available on spID = 4

    assert True == check_track_is_available(redis, 1, [2, 3, 4])


def test_query_tracks_by_track_id(app):
    with app.app_context():
        db = get_db()

    _seed_db_with_data(db)

    with db.scoped_session() as session:
        track_ids = [1, 2, 3, 4, 5, 6, 7]
        tracks = query_tracks_by_track_ids(session, track_ids)

        sorted_track_ids = list(map(lambda track: track.track_id, tracks))
        sorted_track_ids.sort()
        assert len(sorted_track_ids) == len(track_ids)
        assert sorted_track_ids == track_ids


@mock.patch("src.tasks.update_track_is_available.query_registered_content_node_info")
def test_update_track_is_available(
    mock_query_registered_content_node_info,
    app,
    mocker,
):

    # Setup
    mock_query_registered_content_node_info.return_value = [
        {
            "endpoint": "http://content_node7.com",
            "spID": 7,
        },
        {
            "endpoint": "http://content_node9.com",
            "spID": 9,
        },
        {
            "endpoint": "http://content_node10.com",
            "spID": 10,
        },
        {
            "endpoint": "http://content_node11.com",
            "spID": 11,
        },
        {
            "endpoint": "http://content_node12.com",
            "spID": 12,
        },
        {
            "endpoint": "http://content_node13.com",
            "spID": 13,
        },
    ]

    # Mock fetch data to make it so that track ids 1, 2, 3 are unavailable
    def mock_fetch_unavailable_track_ids(*args, **kwargs):
        endpoint = args[0]
        spID = int(endpoint.split("content_node")[1].split(".com")[0])
        if spID == 7 or spID == 9 or spID == 13:
            return [1, 2]
        elif spID == 10 or spID == 11:
            return [3, 4]
        elif spID == 12:
            return [3, 4, 5, 6, 7]
        else:
            return []

    mocker.patch(
        "src.tasks.update_track_is_available.fetch_unavailable_track_ids",
        side_effect=mock_fetch_unavailable_track_ids,
    )

    with app.app_context():
        db = get_db()
        redis = get_redis()

    _seed_db_with_data(db)

    with db.scoped_session() as session:
        fetch_unavailable_track_ids_in_network(session, redis)

    update_tracks_is_available_status(db, redis)

    with db.scoped_session() as session:
        mock_available_tracks = [1, 2, 3]
        tracks = (
            session.query(Track.track_id, Track.is_available)
            .filter(Track.track_id.in_(mock_available_tracks), Track.is_current == True)
            .all()
        )

        # Check that the 'is_available' value is False
        for track in tracks:
            assert track[1] == False

        mock_available_tracks = [4, 5, 6, 7, 8, 9, 10]
        tracks = (
            session.query(Track.track_id, Track.is_available)
            .filter(Track.track_id.in_(mock_available_tracks), Track.is_current == True)
            .all()
        )

        # Check that the 'is_available' value is True
        for track in tracks:
            assert track[1] == True


def _seed_db_with_data(db):
    test_entities = {
        "tracks": [
            {"track_id": 1, "owner_id": 1, "is_current": True},
            {"track_id": 2, "owner_id": 1, "is_current": True},
            {"track_id": 3, "owner_id": 2, "is_current": True},
            {"track_id": 4, "owner_id": 3, "is_current": True},
            {"track_id": 5, "owner_id": 3, "is_current": True},
            {"track_id": 6, "owner_id": 3, "is_current": True},
            {"track_id": 7, "owner_id": 3, "is_current": True},
            # Data that this query should not pick up because track ids are not queried
            {"track_id": 8, "owner_id": 3, "is_current": True},
            {"track_id": 9, "owner_id": 3, "is_current": True},
            {"track_id": 10, "owner_id": 3, "is_current": True},
        ],
        "users": [
            {
                "user_id": 1,
                "primary_id": 7,
                "secondary_ids": [9, 13],
                "is_current": True,
            },
            {
                "user_id": 2,
                "primary_id": 11,
                "secondary_ids": [12, 10],
                "is_current": True,
            },
            {
                "user_id": 3,
                "primary_id": 11,
                "secondary_ids": [13, 10],
                "is_current": True,
            },
            # Data that this query should not pick up because data is not recent
            {
                "user_id": 1,
                "primary_id": 6,
                "secondary_ids": [9, 13],
                "is_current": False,
            },
            {
                "user_id": 1,
                "primary_id": 4,
                "secondary_ids": [9, 13],
                "is_current": False,
            },
            {
                "user_id": 3,
                "primary_id": 7,
                "secondary_ids": [9, 1],
                "is_current": False,
            },
        ],
        # Created three defaulted Content Nodes
        "ursm_content_nodes": [{}, {}, {}],
    }

    populate_mock_db(db, test_entities)

    # structure: track_id | primary_id | secondary_ids
    expected_query_results = [
        (1, 7, [9, 13]),
        (2, 7, [9, 13]),
        (3, 11, [12, 10]),
        (4, 11, [13, 10]),
        (5, 11, [13, 10]),
        (6, 11, [13, 10]),
        (7, 11, [13, 10]),
    ]

    return expected_query_results
