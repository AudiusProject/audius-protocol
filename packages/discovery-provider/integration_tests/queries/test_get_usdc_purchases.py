from datetime import datetime

from integration_tests.utils import populate_mock_db
from src.models.users.usdc_purchase import PurchaseType
from src.queries.get_usdc_purchases import get_usdc_purchases
from src.queries.query_helpers import PurchaseSortMethod, SortDirection
from src.utils.db_session import get_db

test_entities = {
    "users": [
        {"user_id": 10, "name": "a"},
        {"user_id": 20, "name": "c"},
        {"user_id": 30, "name": "b"},
    ],
    "tracks": [
        {
            "track_id": 1,
            "title": "a",
            "owner_id": 10,
            "is_stream_gated": True,
            "stream_conditions": {
                "usdc_purchase": {
                    "price": 100,
                    "splits": {"some_user_bank": 1000000},
                }
            },
        },
        {
            "track_id": 2,
            "title": "f",
            "owner_id": 10,
            "is_stream_gated": True,
            "stream_conditions": {
                "usdc_purchase": {
                    "price": 299,
                    "splits": {"some_user_bank": 2990000},
                }
            },
        },
        {
            "track_id": 3,
            "title": "c",
            "owner_id": 10,
            "is_stream_gated": True,
            "stream_conditions": {
                "usdc_purchase": {
                    "price": 199,
                    "splits": {"some_user_bank": 1990000},
                }
            },
        },
        {
            "track_id": 4,
            "title": "b",
            "owner_id": 10,
            "is_stream_gated": True,
            "stream_conditions": {
                "usdc_purchase": {
                    "price": 350,
                    "splits": {"some_user_bank": 3500000},
                }
            },
        },
        {
            "track_id": 5,
            "title": "d",
            "owner_id": 20,
            "is_stream_gated": True,
            "stream_conditions": {
                "usdc_purchase": {
                    "price": 100,
                    "splits": {"some_user_bank": 1000000},
                }
            },
        },
        {
            "track_id": 6,
            "title": "zzz",
            "owner_id": 20,
            "is_stream_gated": True,
            "stream_conditions": {
                "usdc_purchase": {
                    "price": 100,
                    "splits": {"some_user_bank": 1000000},
                }
            },
        },
    ],
    "usdc_purchases": [
        {
            "slot": 5,
            "buyer_user_id": 20,
            "seller_user_id": 10,
            "amount": 350,
            "extra_amount": 0,
            "content_type": PurchaseType.track,
            "content_id": 4,
            "created_at": datetime(2023, 8, 11),
        },
        {
            "slot": 4,
            "buyer_user_id": 20,
            "seller_user_id": 10,
            "amount": 199,
            "extra_amount": 0,
            "content_type": PurchaseType.track,
            "content_id": 3,
            "created_at": datetime(2023, 8, 10),
        },
        {
            "slot": 8,
            "buyer_user_id": 30,
            "seller_user_id": 20,
            "amount": 100,
            "extra_amount": 0,
            "content_type": PurchaseType.track,
            "content_id": 5,
            "created_at": datetime(2023, 8, 14),
        },
        {
            "slot": 7,
            "buyer_user_id": 30,
            "seller_user_id": 10,
            "amount": 199,
            "extra_amount": 0,
            "content_type": PurchaseType.track,
            "content_id": 3,
            "created_at": datetime(2023, 8, 13),
        },
        {
            "slot": 6,
            "buyer_user_id": 30,
            "seller_user_id": 10,
            "amount": 299,
            "extra_amount": 0,
            "content_type": PurchaseType.track,
            "content_id": 2,
            "created_at": datetime(2023, 8, 12),
        },
        {
            "slot": 9,
            "buyer_user_id": 20,
            "seller_user_id": 10,
            "amount": 299,
            "extra_amount": 0,
            "content_type": PurchaseType.track,
            "content_id": 2,
            "created_at": datetime(2023, 8, 13),
        },
    ],
}


def test_get_purchases(app):
    with app.app_context():
        db = get_db()
        populate_mock_db(db, test_entities)
        sales = get_usdc_purchases(
            {"seller_user_id": 10, "sort_method": PurchaseSortMethod.date}
        )
        assert len(sales) == 5
        assert sales[0]["content_id"] == 3
        assert sales[1]["content_id"] == 2
        assert not any(purchase["content_id"] == 1 for purchase in sales)
        assert not any(purchase["content_id"] == 5 for purchase in sales)
        assert all(purchase["seller_user_id"] == 10 for purchase in sales)

        purchases = get_usdc_purchases(
            {"buyer_user_id": 20, "sort_method": PurchaseSortMethod.date}
        )
        assert len(purchases) == 3
        assert all(purchase["buyer_user_id"] == 20 for purchase in purchases)

        specific_sale = get_usdc_purchases(
            {
                "content_ids": 3,
                "content_type": PurchaseType.track,
                "sort_method": PurchaseSortMethod.date,
            }
        )
        assert len(specific_sale) == 2
        assert specific_sale[0]["content_id"] == 3
        assert specific_sale[1]["content_id"] == 3

        purchases_by_title_asc = get_usdc_purchases(
            {
                "content_type": PurchaseType.track,
                "sort_method": PurchaseSortMethod.content_title,
                "sort_direction": SortDirection.asc,
            }
        )

        by_title_mapped = [
            next(
                track["title"]
                for track in test_entities["tracks"]
                if track["track_id"] == purchase["content_id"]
            )
            for purchase in purchases_by_title_asc
        ]
        assert by_title_mapped == sorted(by_title_mapped)

        purchases_by_artist_desc = get_usdc_purchases(
            {
                "content_type": PurchaseType.track,
                "sort_method": PurchaseSortMethod.artist_name,
                "sort_direction": SortDirection.desc,
            }
        )

        by_artist_owner_ids = [
            next(
                track["owner_id"]
                for track in test_entities["tracks"]
                if track["track_id"] == purchase["content_id"]
            )
            for purchase in purchases_by_artist_desc
        ]
        by_artist_mapped = [
            next(
                user["name"]
                for user in test_entities["users"]
                if user["user_id"] == owner_id
            )
            for owner_id in by_artist_owner_ids
        ]
        assert by_artist_mapped == list(reversed(sorted(by_artist_mapped)))
