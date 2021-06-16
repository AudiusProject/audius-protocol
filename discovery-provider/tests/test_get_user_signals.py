from src.queries.get_user_signals import _get_user_signals
from src.utils.db_session import get_db
from tests.utils import populate_mock_db

def make_user(
        user_id,
        handle,
        profile_picture=None,
        profile_picture_sizes=None,
        cover_photo=None,
        cover_photo_sizes=None
    ):
    return {
        'user_id': user_id,
        'handle': handle,
        'profile_picture': profile_picture,
        'profile_picture_sizes': profile_picture_sizes,
        'cover_photo': cover_photo,
        'cover_photo_sizes': cover_photo_sizes
    }

def make_follow(follower_user_id, followee_user_id):
    return {
        'follower_user_id': follower_user_id,
        'followee_user_id': followee_user_id
    }

def test_get_user_signals(app):
    with app.app_context():
        db = get_db()

    test_entities = {
        'users': [
            make_user(1, 'user1'),
            make_user(2, 'user2'),
            make_user(3, 'user3'),
            make_user(4, 'user4'),
            make_user(5, 'user5'),
            make_user(6, 'user6', profile_picture='Qm0123456789abcdef0123456789abcdef0123456789ab'),
            make_user(7, 'user7', profile_picture_sizes='Qm0123456789abcdef0123456789abcdef0123456789ab'),
            make_user(8, 'user8', cover_photo='Qm0123456789abcdef0123456789abcdef0123456789ab'),
            make_user(9, 'user9', cover_photo_sizes='Qm0123456789abcdef0123456789abcdef0123456789ab'),
            make_user(
                10,
                'user10',
                profile_picture='Qm0123456789abcdef0123456789abcdef0123456789ab',
                cover_photo='Qm0123456789abcdef0123456789abcdef0123456789cd'
            )
        ],
        'follows': [
            make_follow(2, 1),
            make_follow(3, 1),
            make_follow(5, 1),
            make_follow(1, 5),
            make_follow(2, 6),
            make_follow(3, 7),
            make_follow(4, 8),
            make_follow(5, 9),
            make_follow(10, 4)
        ]
    }

    populate_mock_db(db, test_entities)

    with db.scoped_session() as session:
        user_signals = _get_user_signals(session, "user1")
        assert user_signals['num_followers'] == 3
        assert user_signals['num_following'] == 1
        assert user_signals['has_profile_picture'] == False
        assert user_signals['has_cover_photo'] == False

        user_signals = _get_user_signals(session, "user6")
        assert user_signals['num_followers'] == 1
        assert user_signals['num_following'] == 0
        assert user_signals['has_profile_picture'] == True
        assert user_signals['has_cover_photo'] == False

        user_signals = _get_user_signals(session, "user7")
        assert user_signals['num_followers'] == 1
        assert user_signals['num_following'] == 0
        assert user_signals['has_profile_picture'] == True
        assert user_signals['has_cover_photo'] == False

        user_signals = _get_user_signals(session, "user8")
        assert user_signals['num_followers'] == 1
        assert user_signals['num_following'] == 0
        assert user_signals['has_profile_picture'] == False
        assert user_signals['has_cover_photo'] == True

        user_signals = _get_user_signals(session, "user9")
        assert user_signals['num_followers'] == 1
        assert user_signals['num_following'] == 0
        assert user_signals['has_profile_picture'] == False
        assert user_signals['has_cover_photo'] == True

        user_signals = _get_user_signals(session, "user10")
        assert user_signals['num_followers'] == 0
        assert user_signals['num_following'] == 1
        assert user_signals['has_profile_picture'] == True
        assert user_signals['has_cover_photo'] == True
