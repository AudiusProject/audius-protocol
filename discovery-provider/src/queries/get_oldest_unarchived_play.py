from sqlalchemy import func
from src.models.social.play import Play
from src.utils import db_session


def get_oldest_unarchived_play():
    """
    Gets the oldest unarchived play in the database
    """
    db = db_session.get_db_read_replica()
    with db.scoped_session() as session:
        play_query = session.query(func.min(Play.created_at))
        play = play_query.scalar()
        return play
