import logging

from integration_tests.utils import populate_mock_db
from src.queries.get_sitemap import (
    get_playlist_page,
    get_playlist_root,
    get_track_page,
    get_track_root,
    get_user_page,
    get_user_root,
)
from src.utils.db_session import get_db

logger = logging.getLogger(__name__)


def test_populate_playlist_metadata(app):
    """Tests that populate_playlist_metadata works after aggregate_user update"""
    with app.app_context():
        db = get_db()

    test_entities = {
        "playlists": [
            {"playlist_id": i, "playlist_owner_id": i}
            for i in range(10)
        ],
        "tracks": [
            {"track_id": i, "owner_id": i}
            for i in range(10)
        ],
        "users": [
            {"user_id": i, "handle": f"user_{i}"}
            for i in range(20)
        ],
    }

    populate_mock_db(db, test_entities)

    with db.scoped_session() as session:
        track_root = get_track_root(session, 3)
        assert track_root == b'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <sitemap>\n    <loc>https://audius.co/sitemaps/tracks/1.xml</loc>\n  </sitemap>\n  <sitemap>\n    <loc>https://audius.co/sitemaps/tracks/2.xml</loc>\n  </sitemap>\n  <sitemap>\n    <loc>https://audius.co/sitemaps/tracks/3.xml</loc>\n  </sitemap>\n  <sitemap>\n    <loc>https://audius.co/sitemaps/tracks/4.xml</loc>\n  </sitemap>\n</urlset>\n'

        playlist_root = get_playlist_root(session, 2)
        assert playlist_root == b'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <sitemap>\n    <loc>https://audius.co/sitemaps/playlists/1.xml</loc>\n  </sitemap>\n  <sitemap>\n    <loc>https://audius.co/sitemaps/playlists/2.xml</loc>\n  </sitemap>\n  <sitemap>\n    <loc>https://audius.co/sitemaps/playlists/3.xml</loc>\n  </sitemap>\n  <sitemap>\n    <loc>https://audius.co/sitemaps/playlists/4.xml</loc>\n  </sitemap>\n  <sitemap>\n    <loc>https://audius.co/sitemaps/playlists/5.xml</loc>\n  </sitemap>\n  <sitemap>\n    <loc>https://audius.co/sitemaps/playlists/6.xml</loc>\n  </sitemap>\n</urlset>\n'
        # '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <sitemap>\n    <loc>https://audius.co/sitemaps/tracks/1.xml</loc>\n  </sitemap>\n  <sitemap>\n    <loc>https://audius.co/sitemaps/tracks/2.xml</loc>\n  </sitemap>\n  <sitemap>\n    <loc>https://audius.co/sitemaps/tracks/3.xml</loc>\n  </sitemap>\n  <sitemap>\n    <loc>https://audius.co/sitemaps/tracks/4.xml</loc>\n  </sitemap>\n</urlset>\n'

        user_root = get_user_root(session, 12)
        assert user_root == b'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <sitemap>\n    <loc>https://audius.co/sitemaps/users/1.xml</loc>\n  </sitemap>\n  <sitemap>\n    <loc>https://audius.co/sitemaps/users/2.xml</loc>\n  </sitemap>\n</urlset>\n'
        
        track_page_1 = get_track_page(session, 1, 6)
        logger.info(track_page_1)
        logger.info(track_page_1)
        logger.info(track_page_1)
        assert track_page_1 == b'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <sitemap>\n    <loc>https://audius.co/sitemaps/users/1.xml</loc>\n  </sitemap>\n  <sitemap>\n    <loc>https://audius.co/sitemaps/users/2.xml</loc>\n  </sitemap>\n</urlset>\n'

        track_page_2 = get_track_page(session, 2, 6)
        logger.info(track_page_2)
