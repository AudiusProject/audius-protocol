from datetime import datetime
from typing import List

from integration_tests.utils import populate_mock_db
from src.models.users.user import User
from src.tasks.entity_manager.utils import copy_record
from src.utils.db_session import get_db


def test_copy_record(app):
    with app.app_context():
        db = get_db()

    entities = {
        "users": [
            {
                "user_id": 1,
                "handle": "user-1",
                "wallet": "user1wallet",
                "bio": "hi",
                "primary_id": 1,
                "secondary_ids": [2, 3],
                "artist_pick_track_id": 1,
            }
        ]
    }
    populate_mock_db(db, entities)
    with db.scoped_session() as session:
        all_users: List[User] = session.query(User).all()
        assert len(all_users) == 1
        user_1 = all_users[0]
        user_1_updated_at = user_1.updated_at
        user_1_block_number = user_1.blocknumber
        user_1_blockhash = user_1.blockhash
        user_1_txhash = user_1.txhash

        block_number = 10
        event_blockhash = hex(10)
        txhash = "0x01"
        block_datetime = datetime.now()
        user_1_copy = copy_record(
            user_1, block_number, event_blockhash, txhash, block_datetime
        )

        old_user_attributes = user_1.get_attributes_dict()
        user_copy_attributes = user_1_copy.get_attributes_dict()
        for key, value in user_copy_attributes.items():
            if key == "is_current":
                assert value == False
                assert old_user_attributes[key] == True
            elif key == "updated_at":
                assert value == block_datetime
                assert old_user_attributes[key] == user_1_updated_at
            elif key == "blocknumber":
                assert value == block_number
                assert old_user_attributes[key] == user_1_block_number
            elif key == "blockhash":
                assert value == event_blockhash
                assert old_user_attributes[key] == user_1_blockhash
            elif key == "txhash":
                assert value == txhash
                assert old_user_attributes[key] == user_1_txhash
            else:
                assert value == old_user_attributes[key]
