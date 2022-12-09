from sqlalchemy import desc
from src.models.indexing.cid_data import CIDData
from src.tasks.index_nethermind import save_cid_metadata
from src.utils.db_session import get_db


def test_save_cid_metadata(app):
    """Tests that users are indexed correctly"""
    with app.app_context():
        db = get_db()

        with db.scoped_session() as session:
            cid_metadata = {
                "cid1": {"user_id": 1},
                "cid2": {"user_id": 2},
                "cid3": {"track_id": 2},
                "cid4": {"playlist_id": 3},
            }
            cid_type = {
                "cid1": "user",
                "cid2": "user",
                "cid3": "track",
                "cid4": "playlist_data",
            }
            save_cid_metadata(session, cid_metadata, cid_type)

            users = (
                session.query(CIDData)
                .filter(CIDData.type == "user")
                .order_by(desc(CIDData.cid))
                .all()
            )
            assert len(users) == 2
            assert users[0].data == {"user_id": 2}
            assert users[1].data == {"user_id": 1}

            tracks = session.query(CIDData).filter(CIDData.type == "track").all()
            assert len(tracks) == 1
            assert tracks[0].data == {"track_id": 2}

            playlists = (
                session.query(CIDData).filter(CIDData.type == "playlist_data").all()
            )
            assert len(playlists) == 1
            assert playlists[0].data == {"playlist_id": 3}
