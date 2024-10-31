import datetime

from integration_tests.utils import populate_mock_db
from src.queries.get_extended_purchase_gate import (
    add_wallet_info_to_splits,
    calculate_split_amounts,
    get_extended_purchase_gate,
    to_wallet_amount_map,
)
from src.utils.db_session import get_db


def test_get_extended_splits_with_network_cut(app):
    with app.app_context():
        db = get_db()

    entities = {
        "users": [
            {
                "user_id": 1,
                "wallet": "0xEthereum-wallet",
                "spl_usdc_payout_wallet": "second-wallet",
            },
            {"user_id": 2, "wallet": "0xEthereum-wallet-2"},
        ],
        "user_payout_wallet_history": [
            {
                "user_id": 1,
                "spl_usdc_payout_wallet": "first-wallet",
                "block_timestamp": datetime.date(2024, 5, 1),
            },
            {
                "user_id": 1,
                "spl_usdc_payout_wallet": "second-wallet",
                "block_timestamp": datetime.date(2024, 5, 3),
            },
        ],
        "usdc_user_bank_accounts": [
            {"ethereum_address": "0xEthereum-wallet", "bank_account": "user-bank"}
        ],
        "tracks": [
            {
                "track_id": 1,
                "owner_id": 1,
                "is_stream_gated": True,
                "stream_conditions": {
                    "usdc_purchase": {
                        "price": 100,
                        "splits": [{"user_id": 1, "percentage": 100}],
                    }
                },
            }
        ],
        "track_price_history": [
            {
                "track_id": 1,
                "total_price_cents": 100,
                "splits": [{"user_id": 1, "percentage": 100}],
                "access": "stream",
                "block_timestamp": datetime.date(2024, 5, 1),
            }
        ],
    }
    populate_mock_db(db, entities)
    with db.scoped_session() as session:

        # Gets most recent payout wallet by default
        res = get_extended_purchase_gate(
            {
                "usdc_purchase": {
                    "price": 100,
                    "splits": [{"user_id": 1, "percentage": 100}],
                }
            },
            session,
        )
        assert res is not None
        assert res["usdc_purchase"]["splits"][0]["amount"] == 900000
        assert res["usdc_purchase"]["splits"][0]["payout_wallet"] == "second-wallet"
        assert res["usdc_purchase"]["splits"][1]["amount"] == 100000
        assert (
            res["usdc_purchase"]["splits"][1]["payout_wallet"]
            == "3XmVeZ6M1FYDdUQaNeQZf8dipvtzNP6NVb5xjDkdeiNb"
        )

        # Gets older payout wallet when necessary
        splits = add_wallet_info_to_splits(
            session, [{"user_id": 1, "percentage": 100}], datetime.date(2024, 5, 2)
        )
        assert splits[0]["payout_wallet"] == "first-wallet"
        splits = calculate_split_amounts(100, splits)
        legacy_splits = to_wallet_amount_map(splits)
        assert "first-wallet" in legacy_splits
        assert legacy_splits["first-wallet"] == 900000
        assert "3XmVeZ6M1FYDdUQaNeQZf8dipvtzNP6NVb5xjDkdeiNb" in legacy_splits
        assert legacy_splits["3XmVeZ6M1FYDdUQaNeQZf8dipvtzNP6NVb5xjDkdeiNb"] == 100000

        # Falls back to user bank if present
        even_older_splits = add_wallet_info_to_splits(
            session, [{"user_id": 1, "percentage": 100}], datetime.date(2024, 4, 1)
        )
        assert even_older_splits[0]["payout_wallet"] == "user-bank"
        even_older_splits = calculate_split_amounts(100, even_older_splits)
        legacy_splits = to_wallet_amount_map(even_older_splits)
        assert "user-bank" in legacy_splits
        assert legacy_splits["user-bank"] == 900000
        assert "3XmVeZ6M1FYDdUQaNeQZf8dipvtzNP6NVb5xjDkdeiNb" in legacy_splits
        assert legacy_splits["3XmVeZ6M1FYDdUQaNeQZf8dipvtzNP6NVb5xjDkdeiNb"] == 100000

        # Returns None if no user bank indexed and no payout wallet
        other_user_splits = add_wallet_info_to_splits(
            session, [{"user_id": 2, "percentage": 100}], datetime.date(2024, 4, 1)
        )
        assert other_user_splits[0]["payout_wallet"] is None
        other_user_splits = calculate_split_amounts(100, other_user_splits)
        other_user_splits = to_wallet_amount_map(other_user_splits)
        assert "3XmVeZ6M1FYDdUQaNeQZf8dipvtzNP6NVb5xjDkdeiNb" in other_user_splits
        assert (
            other_user_splits["3XmVeZ6M1FYDdUQaNeQZf8dipvtzNP6NVb5xjDkdeiNb"] == 100000
        )
