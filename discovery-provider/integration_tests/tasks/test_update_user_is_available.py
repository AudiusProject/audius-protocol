import logging
from unittest import mock

from integration_tests.utils import populate_mock_db
from src.models.users.user import User
from src.tasks.update_user_is_available import (
    ALL_UNAVAILABLE_USERS_REDIS_KEY,
    _get_redis_set_members_as_list,
    check_user_is_available,
    fetch_unavailable_user_ids,
    fetch_unavailable_user_ids_in_network,
    get_unavailable_users_redis_key,
    query_replica_set_by_user_id,
    query_unavailable_users,
    query_users_by_user_ids,
    update_users_is_available_status,
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


@mock.patch("src.tasks.update_user_is_available.query_registered_content_node_info")
@mock.patch("src.tasks.update_user_is_available.fetch_unavailable_user_ids")
def test_fetch_unavailable_user_ids_in_network(
    mock_fetch_unavailable_user_ids, mock_query_registered_content_node_info, app
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

    spID_1_unavailable_users = [1, 2]
    spID_2_unavailable_users = [2, 3]
    mock_fetch_unavailable_user_ids.side_effect = [
        spID_1_unavailable_users,
        spID_2_unavailable_users,
    ]

    with app.app_context():
        redis = get_redis()
        db = get_db()

    with db.scoped_session() as session:
        fetch_unavailable_user_ids_in_network(session, redis, None, None)

    # Check that redis adds user ids as expected

    spID_1_unavailable_users_redis = set(
        _get_redis_set_members_as_list(redis, get_unavailable_users_redis_key(1))
    )
    for id in spID_1_unavailable_users:
        assert id in spID_1_unavailable_users_redis

    spID_2_unavailable_users_redis = set(
        _get_redis_set_members_as_list(redis, get_unavailable_users_redis_key(2))
    )
    for id in spID_2_unavailable_users:
        assert id in spID_2_unavailable_users_redis

    all_unavailable_users_redis = set(
        _get_redis_set_members_as_list(redis, ALL_UNAVAILABLE_USERS_REDIS_KEY)
    )
    for id in [*spID_1_unavailable_users, *spID_2_unavailable_users]:
        assert id in all_unavailable_users_redis


@mock.patch("src.tasks.update_user_is_available.requests")
def test_fetch_unavailable_user_ids(mock_requests, app):
    """
    Test fetching unavailable user ids from Content Node
    mock_get: reference to the mock requests.get
    look at test_index_users.py for ref
    """

    user_ids = [1, 2, 3]
    mock_return = {
        "data": {"values": user_ids},
        "signer": "signer",
        "timestamp": "2022-05-19T19:50:56.630Z",
        "signature": "signature",
    }

    mock_requests.get.return_value = _mock_response(mock_return, mock_return)

    with app.app_context():
        db = get_db()
    _seed_db_with_data(db)

    with db.scoped_session() as session:
        fetch_response = fetch_unavailable_user_ids("http://content_node.com", session)

    assert fetch_response == [1, 2, 3]


@mock.patch("src.tasks.update_user_is_available.check_user_is_available")
def test_update_users_is_available_status(mock_check_user_is_available, app):
    with app.app_context():
        db = get_db()
        redis = get_redis()

    # Setup
    mock_unavailable_users = [1, 2, 3]
    _seed_db_with_data(db)
    redis.sadd(ALL_UNAVAILABLE_USERS_REDIS_KEY, *mock_unavailable_users)
    mock_check_user_is_available.return_value = False

    update_users_is_available_status(db, redis)

    with db.scoped_session() as session:
        users = (
            session.query(User.user_id, User.is_available)
            .filter(User.user_id.in_(mock_unavailable_users), User.is_current == True)
            .all()
        )

        # Check that the 'is_available' value is False
        for user in users:
            assert user[1] == False

        mock_available_users = [8, 9, 10]
        users = (
            session.query(User.user_id, User.is_available)
            .filter(User.user_id.in_(mock_available_users), User.is_current == True)
            .all()
        )

        # Check that the 'is_available' value is True
        for user in users:
            assert user[1] == True


def test_query_replica_set_by_user_id(app):
    """Test that the query returns a mapping of user id, and replica set"""

    with app.app_context():
        db = get_db()

    expected_query_results = _seed_db_with_data(db)

    with db.scoped_session() as session:
        user_ids = [1, 2, 3, 4]
        sorted_actual_results = query_replica_set_by_user_id(session, user_ids)
        sorted_actual_results.sort(key=lambda entry: entry[0])

        assert len(sorted_actual_results) == len(user_ids)
        assert sorted_actual_results == expected_query_results


def test_check_user_is_available__return_is_not_available(app):
    with app.app_context():
        redis = get_redis()

    spID_2_key = get_unavailable_users_redis_key(2)
    spID_3_key = get_unavailable_users_redis_key(3)
    spID_4_key = get_unavailable_users_redis_key(4)

    # Seed redis some initialized data
    # (1, 2, [3, 4])
    redis.sadd(spID_2_key, 1)
    redis.sadd(spID_3_key, 1)
    redis.sadd(spID_4_key, 1)

    assert False == check_user_is_available(redis, 1, [2, 3, 4])


def test_check_user_is_available__return_is_available_1(app):
    with app.app_context():
        redis = get_redis()

    spID_2_key = get_unavailable_users_redis_key(2)
    spID_3_key = get_unavailable_users_redis_key(3)

    redis.sadd(spID_2_key, 1)
    redis.sadd(spID_3_key, 1)
    # Available on spID = 4

    assert True == check_user_is_available(redis, 1, [2, 3, 4])


def test_check_user_is_available__return_is_available_2(app):
    with app.app_context():
        redis = get_redis()

    spID_2_key = get_unavailable_users_redis_key(2)

    redis.sadd(spID_2_key, 1)
    # Available on spID = 3
    # Available on spID = 4

    assert True == check_user_is_available(redis, 1, [2, 3, 4])


def test_check_user_is_available__return_is_available_3(app):
    with app.app_context():
        redis = get_redis()

    # Available on spID = 2
    # Available on spID = 3
    # Available on spID = 4

    assert True == check_user_is_available(redis, 1, [2, 3, 4])


def test_query_users_by_user_id(app):
    with app.app_context():
        db = get_db()

    _seed_db_with_data(db)

    with db.scoped_session() as session:
        user_ids = [1, 2, 3, 4]
        users = query_users_by_user_ids(session, user_ids)

        sorted_user_ids = list(map(lambda user: user.user_id, users))
        sorted_user_ids.sort()
        assert len(sorted_user_ids) == len(user_ids)
        assert sorted_user_ids == user_ids


def test_query_unavailable_users(app):
    with app.app_context():
        db = get_db()

    _seed_db_with_data(db)

    with db.scoped_session() as session:
        users = query_unavailable_users(session)
        assert len(users) == 1
        assert users[0].user_id == 100


@mock.patch("src.tasks.update_user_is_available.query_registered_content_node_info")
def test_update_user_is_available(
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

    # Mock fetch data to make it so that user ids 1, 2, 3 are unavailable
    def mock_fetch_unavailable_user_ids(*args, **kwargs):
        endpoint = args[0]
        spID = int(endpoint.split("content_node")[1].split(".com")[0])
        if spID == 7 or spID == 9 or spID == 13:
            return [1, 3]
        elif spID == 10 or spID == 11:
            return [2, 3]
        elif spID == 12:
            return [2]
        else:
            return []

    mocker.patch(
        "src.tasks.update_user_is_available.fetch_unavailable_user_ids",
        side_effect=mock_fetch_unavailable_user_ids,
    )

    with app.app_context():
        db = get_db()
        redis = get_redis()

    _seed_db_with_data(db)

    with db.scoped_session() as session:
        fetch_unavailable_user_ids_in_network(session, redis, None, None)

    update_users_is_available_status(db, redis)

    with db.scoped_session() as session:
        mock_available_users = [1, 2, 3]
        users = (
            session.query(User.user_id, User.is_available)
            .filter(User.user_id.in_(mock_available_users), User.is_current == True)
            .all()
        )

        # Check that the 'is_available' value is False
        for user in users:
            assert user[1] == False

        mock_available_users = [4]
        users = (
            session.query(User.user_id, User.is_available)
            .filter(User.user_id.in_(mock_available_users), User.is_current == True)
            .all()
        )

        # Check that the 'is_available' value is True
        for user in users:
            assert user[1] == True


def _seed_db_with_data(db):
    test_entities = {
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
            {
                "user_id": 4,
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
            # Deactivated users
            {
                "user_id": 100,
                "primary_id": 7,
                "secondary_ids": [9, 1],
                "is_current": True,
                "is_available": False,
                "is_deactivated": True,
            },
        ],
        # Created three defaulted Content Nodes
        "ursm_content_nodes": [{}, {}, {}],
    }

    populate_mock_db(db, test_entities)

    # structure: user_id | primary_id | secondary_ids
    expected_query_results = [
        (1, 7, [9, 13]),
        (2, 11, [12, 10]),
        (3, 11, [13, 10]),
        (4, 11, [13, 10]),
    ]

    return expected_query_results
