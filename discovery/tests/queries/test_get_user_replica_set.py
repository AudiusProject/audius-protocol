from src.queries.get_user_replica_set import get_user_replica_set
from src.utils.db_session import get_db
from tests.utils import populate_mock_db


def test_get_user_replica_set(app):
    """Tests that genre metrics can be queried"""
    with app.app_context():
        db = get_db()

        entities = {
            "users": [
                {
                    "user_id": 1,
                    "wallet": "0x01",
                    "creator_node_endpoint": "https://cn1.io,https://cn2.io,https://cn3.io",
                    "primary_id": 1,
                    "secondary_ids": [2, 3],
                },
                {
                    "user_id": 2,
                    "wallet": "0x02",
                    "creator_node_endpoint": "https://cn1.io,https://cn2.io,https://cn3.io",
                },
                {"user_id": 3, "wallet": "0x03", "creator_node_endpoint": None},
            ],
        }

        populate_mock_db(db, entities)

        # User 1 is ideal case where user has all field
        args_1 = {"user_id": 1}
        replica_set_1 = get_user_replica_set(args_1)

        assert replica_set_1 == {
            "user_id": 1,
            "wallet": "0x01",
            "primary": "https://cn1.io",
            "secondary1": "https://cn2.io",
            "secondary2": "https://cn3.io",
            "primarySpID": 1,
            "secondary1SpID": 2,
            "secondary2SpID": 3,
        }

        # User 2 is next case where user has creator_node_endpoint but not primary and secondary
        args_2 = {"user_id": 2}
        replica_set_2 = get_user_replica_set(args_2)
        assert replica_set_2 == {
            "user_id": 2,
            "wallet": "0x02",
            "primary": "https://cn1.io",
            "secondary1": "https://cn2.io",
            "secondary2": "https://cn3.io",
            "primarySpID": None,
            "secondary1SpID": None,
            "secondary2SpID": None,
        }

        # User 3 is next case where user does not have creator node endpoint or primary/secondary
        args_3 = {"user_id": 3}
        replica_set_3 = get_user_replica_set(args_3)
        assert replica_set_3 == {
            "user_id": 3,
            "wallet": "0x03",
            "primary": "",
            "secondary1": None,
            "secondary2": None,
            "primarySpID": None,
            "secondary1SpID": None,
            "secondary2SpID": None,
        }

        # User 4 is next case where user does not exist
        args_4 = {"user_id": 4}
        replica_set_4 = get_user_replica_set(args_4)
        assert replica_set_4 == {}
