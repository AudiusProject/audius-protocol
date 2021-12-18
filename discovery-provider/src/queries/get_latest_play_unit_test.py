from datetime import datetime
from src.queries.get_latest_play import get_latest_play
from src.models import Play


def test_get_latest_play(db_mock):
    """Tests that the latest play is returned"""
    date1 = datetime(2020, 10, 4, 10, 35, 0)
    date2 = datetime(2020, 10, 1, 10, 10, 0)
    date3 = datetime(2020, 9, 20, 8, 1, 0)

    with db_mock.scoped_session() as session:
        Play.__table__.create(db_mock._engine)
        session.add(Play(user_id=1, play_item_id=1, created_at=date1))
        session.add(Play(user_id=2, play_item_id=1, created_at=date2))
        session.add(Play(user_id=3, play_item_id=2, created_at=date3))

    latest_play = get_latest_play()
    assert latest_play == date1
