from datetime import datetime
from typing import List
from unittest import mock

from sqlalchemy import asc

from integration_tests.utils import populate_mock_db
from src.models.delisting.delist_status_cursor import DelistEntity, DelistStatusCursor
from src.models.delisting.track_delist_status import (
    DelistTrackReason,
    TrackDelistStatus,
)
from src.models.delisting.user_delist_status import DelistUserReason, UserDelistStatus
from src.models.tracks.track import Track
from src.models.users.user import User
from src.tasks.update_delist_statuses import (
    DATETIME_FORMAT_STRING,
    DELIST_BATCH_SIZE,
    process_delist_statuses,
)
from src.utils.db_session import get_db


def _seed_db(db):
    test_entities = {
        "users": [
            {
                "user_id": 100,
                "is_current": True,
            },
            {
                "user_id": 200,
                "is_current": True,
            },
        ],
        "tracks": [
            {
                "track_id": 300,
                "is_current": True,
            },
            {
                "track_id": 400,
                "is_current": True,
            },
        ],
    }
    populate_mock_db(db, test_entities)


def _mock_response(json_data, raise_for_status=None):
    """Mock out request.get response"""
    mock_resp = mock.Mock()

    mock_resp.json = mock.Mock(return_value=json_data)

    mock_resp.raise_for_status = mock.Mock()
    if raise_for_status:
        mock_resp.raise_for_status.side_effect = raise_for_status

    return mock_resp


@mock.patch("src.utils.auth_helpers.requests")
def test_update_user_delist_statuses_missing_user(mock_requests, app):
    with app.app_context():
        db = get_db()
    _seed_db(db)

    mock_return = {
        "result": {
            # Note: real response will only have "users" or "tracks" according
            # to the query param, not both. Include both here anyway for mocking simplicity
            "tracks": [],
            "users": [
                {
                    "createdAt": "2023-05-17 18:00:00.999999+00",
                    "userId": 100,
                    "delisted": True,
                    "reason": "STRIKE_THRESHOLD",
                },
                {
                    "createdAt": "2023-05-17 20:00:00.999999+00",
                    "userId": 300,
                    "delisted": True,
                    "reason": "MANUAL",
                },
            ],
        }
    }
    mock_requests.get.return_value = _mock_response(mock_return)

    with db.scoped_session() as session:
        trusted_notifier_endpoint = "http://mock-trusted-notifier.audius.co/"
        # Have not indexed the block with the CREATE USER 300 tx
        current_block_timestamp = datetime.strptime(
            "2023-05-17 19:00:00.999999+00", DATETIME_FORMAT_STRING
        ).timestamp()
        process_delist_statuses(
            session, trusted_notifier_endpoint, current_block_timestamp
        )
        # check user_delist_statuses persisted
        all_delist_statuses: List[UserDelistStatus] = (
            session.query(UserDelistStatus)
            .order_by(asc(UserDelistStatus.created_at))
            .all()
        )
        assert len(all_delist_statuses) == 2

        # check cursor not updated
        user_delist_cursors: List[DelistStatusCursor] = (
            session.query(DelistStatusCursor)
            .filter(DelistStatusCursor.entity == DelistEntity.USERS)
            .all()
        )
        assert len(user_delist_cursors) == 0

        # check users not updated
        users: List[User] = (
            session.query(User).filter(User.is_current, User.user_id == 100).all()
        )
        assert len(users) == 1
        assert not users[0].is_deactivated
        assert users[0].is_available


@mock.patch("src.utils.auth_helpers.requests")
def test_update_user_delist_statuses_skip_missing_user(mock_requests, app):
    with app.app_context():
        db = get_db()
    _seed_db(db)

    mock_return = {
        "result": {
            # Note: real response will only have "users" or "tracks" according
            # to the query param, not both. Include both here anyway for mocking simplicity
            "tracks": [],
            "users": [
                {
                    "createdAt": "2023-05-17 18:00:00.999999+00",
                    "userId": 100,
                    "delisted": True,
                    "reason": "STRIKE_THRESHOLD",
                },
                {
                    "createdAt": "2023-05-17 20:00:00.999999+00",
                    "userId": 300,
                    "delisted": True,
                    "reason": "MANUAL",
                },
            ],
        }
    }
    mock_requests.get.return_value = _mock_response(mock_return)

    with db.scoped_session() as session:
        trusted_notifier_endpoint = "http://mock-trusted-notifier.audius.co/"
        # Will never index CREATE USER 300 into db at this point in indexing.
        # Should skip delist for user 300 and advance cursor.
        current_block_timestamp = datetime.strptime(
            "2023-05-17 21:00:00.999999+00", DATETIME_FORMAT_STRING
        ).timestamp()
        process_delist_statuses(
            session, trusted_notifier_endpoint, current_block_timestamp
        )
        # check user_delist_statuses persisted
        all_delist_statuses: List[UserDelistStatus] = (
            session.query(UserDelistStatus)
            .order_by(asc(UserDelistStatus.created_at))
            .all()
        )
        assert len(all_delist_statuses) == 2

        # check cursor updated
        user_delist_cursors: List[DelistStatusCursor] = (
            session.query(DelistStatusCursor)
            .filter(DelistStatusCursor.entity == DelistEntity.USERS)
            .all()
        )
        assert len(user_delist_cursors) == 1
        assert user_delist_cursors[0].host == trusted_notifier_endpoint
        assert user_delist_cursors[0].created_at == all_delist_statuses[1].created_at

        # check user 100 updated
        users: List[User] = (
            session.query(User).filter(User.is_current, User.user_id == 100).all()
        )
        assert len(users) == 1
        assert users[0].is_deactivated
        assert not users[0].is_available


@mock.patch("src.utils.auth_helpers.requests")
def test_update_user_delist_statuses(mock_requests, app):
    with app.app_context():
        db = get_db()
    _seed_db(db)

    mock_return = {
        "result": {
            # Note: real response will only have "users" or "tracks" according
            # to the query param, not both. Include both here anyway for mocking simplicity
            "tracks": [],
            "users": [
                {
                    "createdAt": "2023-05-17 18:00:00.999999+00",
                    "userId": 100,
                    "delisted": True,
                    "reason": "STRIKE_THRESHOLD",
                },
                {
                    "createdAt": "2023-05-17 19:00:00.999999+00",
                    "userId": 100,
                    "delisted": False,
                    "reason": "COPYRIGHT_SCHOOL",
                },
                {
                    "createdAt": "2023-05-17 20:00:00.999999+00",
                    "userId": 200,
                    "delisted": True,
                    "reason": "MANUAL",
                },
            ],
        }
    }
    mock_requests.get.return_value = _mock_response(mock_return)

    with db.scoped_session() as session:
        trusted_notifier_endpoint = "http://mock-trusted-notifier.audius.co/"
        current_block_timestamp = datetime.strptime(
            "2023-05-17 20:00:01.999999+00", DATETIME_FORMAT_STRING
        ).timestamp()
        process_delist_statuses(
            session, trusted_notifier_endpoint, current_block_timestamp
        )
        # check user_delist_statuses
        all_delist_statuses: List[UserDelistStatus] = (
            session.query(UserDelistStatus)
            .order_by(asc(UserDelistStatus.created_at))
            .all()
        )
        assert len(all_delist_statuses) == 3
        assert all_delist_statuses[0].user_id == 100
        assert all_delist_statuses[0].delisted
        assert all_delist_statuses[0].reason == DelistUserReason.STRIKE_THRESHOLD
        assert all_delist_statuses[1].user_id == 100
        assert not all_delist_statuses[1].delisted
        assert all_delist_statuses[1].reason == DelistUserReason.COPYRIGHT_SCHOOL
        assert all_delist_statuses[2].user_id == 200
        assert all_delist_statuses[2].delisted
        assert all_delist_statuses[2].reason == DelistUserReason.MANUAL

        # check cursor persisted
        user_delist_cursors: List[DelistStatusCursor] = (
            session.query(DelistStatusCursor)
            .filter(DelistStatusCursor.entity == DelistEntity.USERS)
            .all()
        )
        assert len(user_delist_cursors) == 1
        assert user_delist_cursors[0].host == trusted_notifier_endpoint
        assert user_delist_cursors[0].created_at == all_delist_statuses[2].created_at

        # check users updated
        all_users: List[User] = (
            session.query(User)
            .filter(User.is_current)
            .order_by(asc(User.user_id))
            .all()
        )
        assert len(all_users) == 2
        assert not all_users[0].is_deactivated
        assert all_users[0].is_available
        assert all_users[1].is_deactivated
        assert not all_users[1].is_available


@mock.patch("src.utils.auth_helpers.requests")
def test_update_track_delist_statuses_missing_track(mock_requests, app):
    with app.app_context():
        db = get_db()
    _seed_db(db)

    mock_return = {
        "result": {
            # Note: real response will only have "users" or "tracks" according
            # to the query param, not both. Include both here anyway for mocking simplicity
            "users": [],
            "tracks": [
                {
                    "createdAt": "2023-05-17 20:47:29.362983+00",
                    "trackId": 300,
                    "ownerId": 100,
                    "trackCid": "1234",
                    "delisted": True,
                    "reason": "DMCA",
                },
                {
                    "createdAt": "2023-05-17 21:47:29.362983+00",
                    "trackId": 500,
                    "ownerId": 200,
                    "trackCid": "5678",
                    "delisted": True,
                    "reason": "ACR",
                },
            ],
        }
    }
    mock_requests.get.return_value = _mock_response(mock_return)

    with db.scoped_session() as session:
        trusted_notifier_endpoint = "http://mock-trusted-notifier.audius.co/"
        # Have not indexed the block with the CREATE TRACK 500 tx
        current_block_timestamp = datetime.strptime(
            "2023-05-17 21:00:00.999999+00", DATETIME_FORMAT_STRING
        ).timestamp()
        process_delist_statuses(
            session, trusted_notifier_endpoint, current_block_timestamp
        )
        # check track_delist_statuses persisted
        all_delist_statuses: List[TrackDelistStatus] = (
            session.query(TrackDelistStatus)
            .order_by(asc(TrackDelistStatus.created_at))
            .all()
        )
        assert len(all_delist_statuses) == 2

        # check cursor not updated
        track_delist_cursors: List[DelistStatusCursor] = (
            session.query(DelistStatusCursor)
            .filter(DelistStatusCursor.entity == DelistEntity.TRACKS)
            .all()
        )
        assert len(track_delist_cursors) == 0

        # check tracks not updated
        tracks: List[Track] = (
            session.query(Track).filter(Track.is_current, Track.track_id == 300).all()
        )
        assert len(tracks) == 1
        assert not tracks[0].is_delete
        assert tracks[0].is_available


@mock.patch("src.utils.auth_helpers.requests")
def test_update_track_delist_statuses_skip_missing_track(mock_requests, app):
    with app.app_context():
        db = get_db()
    _seed_db(db)

    mock_return = {
        "result": {
            # Note: real response will only have "users" or "tracks" according
            # to the query param, not both. Include both here anyway for mocking simplicity
            "users": [],
            "tracks": [
                {
                    "createdAt": "2023-05-17 20:47:29.362983+00",
                    "trackId": 300,
                    "ownerId": 100,
                    "trackCid": "1234",
                    "delisted": True,
                    "reason": "DMCA",
                },
                {
                    "createdAt": "2023-05-17 21:47:29.362983+00",
                    "trackId": 500,
                    "ownerId": 200,
                    "trackCid": "5678",
                    "delisted": True,
                    "reason": "ACR",
                },
            ],
        }
    }
    mock_requests.get.return_value = _mock_response(mock_return)

    with db.scoped_session() as session:
        trusted_notifier_endpoint = "http://mock-trusted-notifier.audius.co/"
        # Will never index CREATE TRACK 500 into db at this point in indexing.
        # Should skip delist for track 500 and advance cursor.
        current_block_timestamp = datetime.strptime(
            "2023-05-17 22:00:00.999999+00", DATETIME_FORMAT_STRING
        ).timestamp()
        process_delist_statuses(
            session, trusted_notifier_endpoint, current_block_timestamp
        )
        # check track_delist_statuses persisted
        all_delist_statuses: List[TrackDelistStatus] = (
            session.query(TrackDelistStatus)
            .order_by(asc(TrackDelistStatus.created_at))
            .all()
        )
        assert len(all_delist_statuses) == 2

        # check cursor updated
        track_delist_cursors: List[DelistStatusCursor] = (
            session.query(DelistStatusCursor)
            .filter(DelistStatusCursor.entity == DelistEntity.TRACKS)
            .all()
        )
        assert len(track_delist_cursors) == 1
        assert track_delist_cursors[0].host == trusted_notifier_endpoint
        assert track_delist_cursors[0].created_at == all_delist_statuses[1].created_at

        # check track 300 updated
        tracks: List[Track] = (
            session.query(Track).filter(Track.is_current, Track.track_id == 300).all()
        )
        assert len(tracks) == 1
        assert tracks[0].is_delete
        assert not tracks[0].is_available


@mock.patch("src.utils.auth_helpers.requests")
def test_update_track_delist_statuses(mock_requests, app):
    with app.app_context():
        db = get_db()
    _seed_db(db)

    mock_return = {
        "result": {
            # Note: real response will only have "users" or "tracks" according
            # to the query param, not both. Include both here anyway for mocking simplicity
            "users": [],
            "tracks": [
                {
                    "createdAt": "2023-05-17 20:47:29.362983+00",
                    "trackId": 300,
                    "ownerId": 100,
                    "trackCid": "1234",
                    "delisted": True,
                    "reason": "DMCA",
                },
                {
                    "createdAt": "2023-05-17 21:47:29.362983+00",
                    "trackId": 400,
                    "ownerId": 200,
                    "trackCid": "5678",
                    "delisted": True,
                    "reason": "ACR",
                },
                {
                    "createdAt": "2023-05-17 22:47:29.362983+00",
                    "trackId": 400,
                    "ownerId": 200,
                    "trackCid": "5678",
                    "delisted": False,
                    "reason": "MANUAL",
                },
            ],
        }
    }
    mock_requests.get.return_value = _mock_response(mock_return)

    with db.scoped_session() as session:
        trusted_notifier_endpoint = "http://mock-trusted-notifier.audius.co/"
        current_block_timestamp = datetime.strptime(
            "2023-05-17 23:00:00.999999+00", DATETIME_FORMAT_STRING
        ).timestamp()
        process_delist_statuses(
            session, trusted_notifier_endpoint, current_block_timestamp
        )
        # check track_delist_statuses
        all_delist_statuses: List[TrackDelistStatus] = (
            session.query(TrackDelistStatus)
            .order_by(asc(TrackDelistStatus.created_at))
            .all()
        )
        assert len(all_delist_statuses) == 3
        assert all_delist_statuses[0].track_id == 300
        assert all_delist_statuses[0].owner_id == 100
        assert all_delist_statuses[0].track_cid == "1234"
        assert all_delist_statuses[0].delisted
        assert all_delist_statuses[0].reason == DelistTrackReason.DMCA
        assert all_delist_statuses[1].track_id == 400
        assert all_delist_statuses[1].owner_id == 200
        assert all_delist_statuses[1].track_cid == "5678"
        assert all_delist_statuses[1].delisted
        assert all_delist_statuses[1].reason == DelistTrackReason.ACR
        assert all_delist_statuses[2].track_id == 400
        assert all_delist_statuses[2].owner_id == 200
        assert all_delist_statuses[2].track_cid == "5678"
        assert not all_delist_statuses[2].delisted
        assert all_delist_statuses[2].reason == DelistTrackReason.MANUAL

        # check cursor persisted
        track_delist_cursors: List[DelistStatusCursor] = (
            session.query(DelistStatusCursor)
            .filter(DelistStatusCursor.entity == DelistEntity.TRACKS)
            .all()
        )
        assert len(track_delist_cursors) == 1
        assert track_delist_cursors[0].host == trusted_notifier_endpoint
        assert track_delist_cursors[0].created_at == all_delist_statuses[2].created_at

        # check tracks updated
        all_tracks: List[Track] = (
            session.query(Track)
            .filter(Track.is_current)
            .order_by(asc(Track.track_id))
            .all()
        )
        assert len(all_tracks) == 2
        assert all_tracks[0].is_delete
        assert not all_tracks[0].is_available
        assert not all_tracks[1].is_delete
        assert all_tracks[1].is_available


def test_format_poll_more_endpoint(app, mocker):
    with app.app_context():
        db = get_db()

    def assert_signed_get(*args, **kwargs):
        poll_more_endpoint = args[0]
        endpoint, query_params = poll_more_endpoint.split("?")
        entity = endpoint.split("/")[-1]
        assert entity == "users" or entity == "tracks"

        query_params = query_params.split("&")
        assert len(query_params) == 2
        for query_param in query_params:
            key, val = query_param.split("=")
            if key == "batchSize":
                assert val == str(DELIST_BATCH_SIZE)
            if key == "cursor":
                if entity == "users":
                    assert val == "2023-05-17T18%3A00%3A00.999999Z"
                else:
                    assert val == "2023-06-06T12%3A00%3A00.000000Z"

        mock_return = {
            "result": {
                "users": [],
                "tracks": [],
            }
        }
        return _mock_response(mock_return)

    with db.scoped_session() as session:
        trusted_notifier_endpoint = "http://mock-trusted-notifier.audius.co/"
        session.execute("TRUNCATE delist_status_cursor")
        session.execute(
            """
            INSERT INTO delist_status_cursor
            (created_at, host, entity)
            VALUES (:cursor1, :endpoint1, :entity1),
            (:cursor2, :endpoint2, :entity2)
            """,
            {
                "cursor1": "2023-05-17 18:00:00.999999+00",
                "endpoint1": trusted_notifier_endpoint,
                "entity1": DelistEntity.USERS,
                "cursor2": "2023-06-06 12:00:00.000000+00",
                "endpoint2": trusted_notifier_endpoint,
                "entity2": DelistEntity.TRACKS,
            },
        )
        mocker.patch(
            "src.tasks.update_delist_statuses.signed_get",
            side_effect=assert_signed_get,
            autospec=True,
        )
        current_block_timestamp = datetime.strptime(
            "2023-05-17 19:00:00.999999+00", DATETIME_FORMAT_STRING
        ).timestamp()
        process_delist_statuses(
            session, trusted_notifier_endpoint, current_block_timestamp
        )

        # check cursor unchanged
        delist_cursors: List[DelistStatusCursor] = (
            session.query(DelistStatusCursor)
            .order_by(asc(DelistStatusCursor.created_at))
            .all()
        )
        assert len(delist_cursors) == 2
        assert delist_cursors[0].host == trusted_notifier_endpoint
        assert delist_cursors[0].entity == DelistEntity.USERS
        assert str(delist_cursors[0].created_at) == "2023-05-17 18:00:00.999999+00:00"
        assert delist_cursors[1].host == trusted_notifier_endpoint
        assert delist_cursors[1].entity == DelistEntity.TRACKS
        assert str(delist_cursors[1].created_at) == "2023-06-06 12:00:00+00:00"
