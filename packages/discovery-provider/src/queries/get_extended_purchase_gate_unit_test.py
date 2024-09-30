import logging
from typing import List

from src.queries.get_extended_purchase_gate import Split, calculate_split_amounts

logger = logging.getLogger(__name__)


def test_calculate_split_amounts_validate(caplog):
    caplog.set_level(logging.DEBUG)
    price = 100
    og_splits: List[Split] = [
        {"user_id": 1, "percentage": 0.00010},
        {"user_id": 2, "percentage": 1.00000},
        {"user_id": 3, "percentage": 10.00000},
        {"user_id": 4, "percentage": 3.33333},
        {"user_id": 5, "percentage": 3.33333},
        {"user_id": 6, "percentage": 3.33333},
        {"user_id": 7, "percentage": 25.0000},
        {"user_id": 8, "percentage": 50.0000},
        {"user_id": 9, "percentage": 4.00000},
    ]
    res_splits = calculate_split_amounts(price, og_splits, network_take_rate=0)
    split_map_by_user = {
        split["user_id"]: split for split in res_splits if "user_id" in split
    }
    assert split_map_by_user[1]["amount"] == 1
    assert split_map_by_user[2]["amount"] == 10000
    assert split_map_by_user[3]["amount"] == 100000
    assert split_map_by_user[4]["amount"] == 33333
    assert split_map_by_user[5]["amount"] == 33333
    assert split_map_by_user[6]["amount"] == 33333
    assert split_map_by_user[7]["amount"] == 250000
    assert split_map_by_user[8]["amount"] == 500000
    assert split_map_by_user[9]["amount"] == 40000

    price = 197
    og_splits: List[Split] = [
        {"user_id": 1, "percentage": 0.00010},
        {"user_id": 2, "percentage": 1.00000},
        {"user_id": 3, "percentage": 10.00000},
        {"user_id": 4, "percentage": 3.333333},
        {"user_id": 5, "percentage": 3.333333},
        {"user_id": 6, "percentage": 3.333333},
        {"user_id": 7, "percentage": 25.00000},
        {"user_id": 8, "percentage": 50.00000},
        {"user_id": 9, "percentage": 4.00000},
    ]
    res_splits = calculate_split_amounts(price, og_splits, network_take_rate=0)
    split_map_by_user = {
        split["user_id"]: split for split in res_splits if "user_id" in split
    }
    assert split_map_by_user[1]["amount"] == 2
    assert split_map_by_user[2]["amount"] == 19700
    assert split_map_by_user[3]["amount"] == 197000
    assert split_map_by_user[4]["amount"] == 65666
    assert split_map_by_user[5]["amount"] == 65666
    assert split_map_by_user[6]["amount"] == 65666
    assert split_map_by_user[7]["amount"] == 492500
    assert split_map_by_user[8]["amount"] == 985000
    assert split_map_by_user[9]["amount"] == 78800

    price = 100
    og_splits: List[Split] = [
        {"user_id": 1, "percentage": 33.3333},
        {"user_id": 2, "percentage": 66.6667},
    ]
    res_splits = calculate_split_amounts(price, og_splits, network_take_rate=0)

    split_map_by_user = {
        split["user_id"]: split for split in res_splits if "user_id" in split
    }
    assert split_map_by_user[1]["amount"] == 333333
    assert split_map_by_user[2]["amount"] == 666667

    price = 202
    og_splits: List[Split] = [
        {"user_id": 1, "percentage": 33.33334},
        {"user_id": 2, "percentage": 33.33333},
        {"user_id": 3, "percentage": 33.33333},
    ]
    res_splits = calculate_split_amounts(price, og_splits, network_take_rate=0)

    split_map_by_user = {
        split["user_id"]: split for split in res_splits if "user_id" in split
    }
    assert split_map_by_user[1]["amount"] == 673334
    assert split_map_by_user[2]["amount"] == 673333
    assert split_map_by_user[3]["amount"] == 673333
