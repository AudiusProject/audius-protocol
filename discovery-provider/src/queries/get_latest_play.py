from src.models import Play
from src.utils import db_session


def get_latest_play():
    """
    Gets the latest play in the database
    """
    db = db_session.get_db_read_replica()
    with db.scoped_session() as session:
        play_query = (
            session.query(Play.created_at).order_by(Play.created_at.desc()).limit(1)
        )
        play = play_query.scalar()
        return play
