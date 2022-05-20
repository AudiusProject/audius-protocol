import logging
from unittest import mock

from integration_tests.utils import populate_mock_db
from src.models import Track, User
from src.tasks.update_track_is_available import (
    fetch_unavailable_track_ids,
    query_replica_set_by_track_id,
)
from src.utils.db_session import get_db

logger = logging.getLogger(__name__)


# Mock out request response
def _mock_response(json_data, status=200, raise_for_status=None):
    mock_resp = mock.Mock()

    mock_resp.json = mock.Mock(return_value=json_data)
    mock_resp.status_code = status

    mock_resp.raise_for_status = mock.Mock()
    if raise_for_status:
        mock_resp.raise_for_status.side_effect = raise_for_status

    return mock_resp


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


def test_query_replica_set_by_track_id(app):
    """Test that the query returns a mapping of track id, user id, and replica set"""

    with app.app_context():
        db = get_db()

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
            {"track_id": 10, "owner_id": 3, "is_current": True}
        ],
        "users": [
            {"user_id": 1, "primary_id": 7, "secondary_ids": [9, 13], "is_current": True},
            {"user_id": 2, "primary_id": 11, "secondary_ids": [12, 10], "is_current": True},
            {"user_id": 3, "primary_id": 11, "secondary_ids": [13, 10], "is_current": True},
            # Data that this query should not pick up because data is not recent
            {"user_id": 1, "primary_id": 6, "secondary_ids": [9, 13], "is_current": False},
            {"user_id": 1, "primary_id": 4, "secondary_ids": [9, 13], "is_current": False},
            {"user_id": 3, "primary_id": 7, "secondary_ids": [9, 1], "is_current": False},
        ]
    }

    populate_mock_db(db, test_entities)

    print_dummy_tracks_and_users(db)

    expected_query_results = [(1, 1, 7, [9, 13]), (2, 1, 7, [9, 13]), (3, 2, 11, [12, 10]), (4, 3, 11, [13, 10]), (5, 3, 11, [13, 10]), (6, 3, 11, [13, 10]), (7, 3, 11, [13, 10])]
    track_ids = [1, 2, 3, 4, 5, 6, 7]
    sorted_actual_results = _sort_query_replica_set_by_track_id(
         query_replica_set_by_track_id(db, track_ids)
    )

    assert len(sorted_actual_results) == len(track_ids)
    assert sorted_actual_results == expected_query_results


def print_dummy_tracks_and_users(db):
    with db.scoped_session() as session:
        tracks = session.query(
            Track.track_id, Track.owner_id, Track.is_current
        ).all()

        print('tracks')
        print(tracks)

        users = session.query(
            User.user_id, User.primary_id, User.secondary_ids, User.is_current 
        ).all()

        print('users')
        print(users)


def _sort_query_replica_set_by_track_id(list):
    """sort by the track id in ascending order"""
    list.sort(key=lambda entry: entry[0])
    return list
