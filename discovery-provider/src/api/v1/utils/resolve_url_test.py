from datetime import datetime
from flask import Flask
import pytest
from src.models import User
from src.api.v1.utils.resolve_url import resolve_url
from src.api.v1 import api as api_v1


@pytest.fixture
def app():
    a = Flask(__name__)
    a.register_blueprint(api_v1.bp)
    yield a


def test_resolve_track_url(db_mock, app):
    """Tests that it resolves a track url"""
    with app.test_request_context():
        with db_mock.scoped_session() as session:
            url = 'https://audius.co/urbanbankai/mb-shola-vivienne-%22westwood%22-87325'
            resolved_url = resolve_url(session, url)

            assert resolved_url == '/v1/tracks/799Yv'


def test_resolve_playlist_url(db_mock, app):
    """Tests that it resolves a playlist url"""
    with app.test_request_context():
        with db_mock.scoped_session() as session:
            url = 'https://audius.co/urbanbankai/playlist/up-next-atl-august-2020-9801'
            resolved_url = resolve_url(session, url)

            assert resolved_url == '/v1/playlists/ePkW0'


def test_resolve_user_url(db_mock, app):
    """Tests that it resolves a user url"""
    with app.test_request_context():
        with db_mock.scoped_session() as session:
            User.__table__.create(db_mock._engine)
            session.add(User(
                blockhash="0x2969e88561fac17ca19c1749cb3e614211ba15c8e471be55de47d0b8ca6acf5f",
                is_current=True,
                updated_at=datetime.now(),
                created_at=datetime.now(),
                blocknumber=16914541,
                handle="Urbanbankai",
                handle_lc="urbanbankai",
                user_id=42727
            ))
            url = 'https://audius.co/urbanbankai'
            resolved_url = resolve_url(session, url)

            assert resolved_url == '/v1/users/DE677'


def test_resolve_non_fully_qualified_url(db_mock, app):
    """Tests that it resolves a track url when not fully qualified"""
    with app.test_request_context():
        with db_mock.scoped_session() as session:
            url = '/urbanbankai/mb-shola-vivienne-%22westwood%22-87325'
            resolved_url = resolve_url(session, url)

            assert resolved_url == '/v1/tracks/799Yv'
