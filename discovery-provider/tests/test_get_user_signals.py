from src.queries.get_user_signals import _get_user_signals
from src.utils.db_session import get_db
from tests.utils import populate_mock_db

def make_user(blockhash, number, parenthash, is_current, user_id, handle):
    return {
        "blockhash": blockhash,
        "number": number,
        "parenthash": parenthash,
        "is_current": is_current,
        "user_id": user_id,
        "handle": handle
    }

def make_follow(blockhash, blocknumber, is_current, follower_user_id, followee_user_id):
    return {
        "blockhash": blockhash,
        "blocknumber": blocknumber,
        "is_current": is_current,
        "follower_user_id": follower_user_id,
        "followee_user_id": followee_user_id
    }

def test_get_user_signals(app):
    with app.app_context():
        db = get_db()

    blockhash1, blocknumber1 = '0x01', 1
    blockhash2, blocknumber2 = '0x02', 2
    blockhash3, blocknumber3 = '0x03', 3

    test_entities = {
        'users': [
            make_user('0x00', 0, None, False, 1, handle="user1"),
            make_user(blockhash1, blocknumber1, None, True, 1, handle="user1"),
            make_user(blockhash2, blocknumber2, blockhash1, True, 2, handle="user2"),
            make_user(blockhash2, blocknumber2, blockhash1, True, 3, handle="user3"),
            make_user(blockhash2, blocknumber2, blockhash1, True, 4, handle="user4"),
            make_user(blockhash2, blocknumber2, blockhash1, True, 5, handle="user5")
        ],
        'follows': [
            make_follow(blockhash3, blocknumber3, True, 2, 1),
            make_follow(blockhash3, blocknumber3, True, 3, 1),
            make_follow(blockhash3, blocknumber3, True, 5, 1),
            make_follow(blockhash3, blocknumber3, True, 1, 5)
        ]
    }

    populate_mock_db(db, test_entities)

    with db.scoped_session() as session:
        user_signals = _get_user_signals(session, "user1")
        assert user_signals['num_followers'] == 3
        assert user_signals['num_following'] == 1
