import json
from typing import List

from web3 import Web3
from web3.datastructures import AttributeDict

from integration_tests.challenges.index_helpers import UpdateTask
from integration_tests.utils import populate_mock_db, populate_mock_db_blocks
from src.models.social.reaction import Reaction
from src.tasks.entity_manager.entity_manager import entity_manager_update
from src.tasks.entity_manager.utils import Action, EntityType
from src.utils.db_session import get_db


def test_index_tip_reactions(app, mocker):
    "Tests indexing of tip reactions"

    with app.app_context():
        db = get_db()
        web3 = Web3()
        update_task = UpdateTask(web3, None)

    tx_receipts = {
        # user 2 reacts to the tip they received from user 1
        "IndexTipReaction1Tx": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 1,
                        "_entityType": EntityType.TIP,
                        "_userId": 2,
                        "_action": Action.UPDATE,
                        "_metadata": f'{{ "cid": "", "data": {json.dumps({"reacted_to": "user_1_tip_2", "reaction_value": 1 })}}}',
                        "_signer": "user2wallet",
                    }
                )
            },
        ],
        # user 1 fake reacts to the tip they sent to user 2
        "IndexTipReaction2Tx": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 1,
                        "_entityType": EntityType.TIP,
                        "_userId": 1,
                        "_action": Action.UPDATE,
                        "_metadata": f'{{ "cid": "", "data": {json.dumps({"reacted_to": "user_1_tip_2", "reaction_value": 1 })}}}',
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
        # user 3 reacts to tip received from user 1
        "IndexTipReaction3Tx": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 1,
                        "_entityType": EntityType.TIP,
                        "_userId": 3,
                        "_action": Action.UPDATE,
                        "_metadata": f'{{ "cid": "", "data": {json.dumps({"reacted_to": "user_1_tip_3", "reaction_value": 2 })}}}',
                        "_signer": "user3wallet",
                    }
                )
            },
        ],
        # user 3 sends a new reaction to the previous tip
        "IndexTipReaction4Tx": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 1,
                        "_entityType": EntityType.TIP,
                        "_userId": 3,
                        "_action": Action.UPDATE,
                        "_metadata": f'{{ "cid": "", "data": {json.dumps({"reacted_to": "user_1_tip_3", "reaction_value": 3 })}}}',
                        "_signer": "user2wallet",
                    }
                )
            },
        ],
        # user 3 reacts to tip received from user 1 with incorrect reaction_value
        "IndexTipReaction5Tx": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 1,
                        "_entityType": EntityType.TIP,
                        "_userId": 3,
                        "_action": Action.UPDATE,
                        "_metadata": f'{{ "cid": "", "data": {json.dumps({"reacted_to": "user_1_tip_3", "reaction_value": 10 })}}}',
                        "_signer": "user3wallet",
                    }
                )
            },
        ],
        "MalformedReaction1": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 1,
                        "_entityType": EntityType.TIP,
                        "_userId": 3,
                        "_action": Action.UPDATE,
                        "_metadata": f'{{ "cid": "", "data": {json.dumps({ "reaction_value": 1 })}}}',
                        "_signer": "user3wallet",
                    }
                )
            },
        ],
        "MalformedReaction2": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 1,
                        "_entityType": EntityType.TIP,
                        "_userId": 3,
                        "_action": Action.UPDATE,
                        "_metadata": f'{{ "cid": "", "data": {json.dumps({"reacted_to": "user_1_tip_3" })}}}',
                        "_signer": "user3wallet",
                    }
                )
            },
        ],
        "MalformedReaction3": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 1,
                        "_entityType": EntityType.TIP,
                        "_userId": 3,
                        "_action": Action.UPDATE,
                        "_metadata": f'{{ "cid": "", "data": {json.dumps({})}}}',
                        "_signer": "user3wallet",
                    }
                )
            },
        ],
    }

    entity_manager_txs = [
        AttributeDict({"transactionHash": update_task.web3.to_bytes(text=tx_receipt)})
        for tx_receipt in tx_receipts
    ]

    def get_events_side_effect(_, tx_receipt):
        return tx_receipts[tx_receipt["transactionHash"].decode("utf-8")]

    mocker.patch(
        "src.tasks.entity_manager.entity_manager.get_entity_manager_events_tx",
        side_effect=get_events_side_effect,
        autospec=True,
    )

    entities = {
        "users": [
            {"user_id": user_id, "wallet": f"user{user_id}wallet"}
            for user_id in range(1, 4)
        ],
        "user_tips": [
            {
                "slot": 0,
                "signature": "user_1_tip_2",
                "sender_user_id": 1,
                "receiver_user_id": 2,
                "amount": 100000000,
            },
            {
                "slot": 1,
                "signature": "user_1_tip_3",
                "sender_user_id": 1,
                "receiver_user_id": 3,
                "amount": 100000000,
            },
        ],
    }
    populate_mock_db_blocks(db, 0, 1)
    populate_mock_db(db, entities)

    with db.scoped_session() as session:
        # index transactions
        entity_manager_update(
            update_task,
            session,
            entity_manager_txs,
            block_number=0,
            block_timestamp=1000000000,
            block_hash=hex(0),
        )

        all_tip_reactions: List[Reaction] = session.query(Reaction).all()

        assert 2 == len(all_tip_reactions)

        reaction1 = all_tip_reactions[0]
        assert reaction1.id == 1
        assert reaction1.reacted_to == "user_1_tip_2"
        assert reaction1.reaction_type == "tip"
        assert reaction1.reaction_value == 1
        assert reaction1.sender_wallet == "user1wallet"

        reaction2 = all_tip_reactions[1]
        assert reaction2.id == 2
        assert reaction2.reacted_to == "user_1_tip_3"
        assert reaction2.reaction_type == "tip"
        assert reaction2.reaction_value == 3
        assert reaction2.sender_wallet == "user1wallet"
