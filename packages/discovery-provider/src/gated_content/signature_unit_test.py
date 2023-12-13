import json
from datetime import datetime

from src.api_helpers import recover_wallet
from src.gated_content.signature import (
    get_gated_content_signature,
    get_gated_content_signature_for_user_wallet,
)
from src.utils.config import shared_config


def test_signature():
    track_id = 1
    track_cid = "some-track-cid"
    premium_content_type = "track"
    before_ms = int(datetime.utcnow().timestamp() * 1000)

    # for a non-gated track
    result = get_gated_content_signature(
        {
            "track_id": track_id,
            "cid": track_cid,
            "type": premium_content_type,
            "is_gated": False,
        }
    )
    signature = result["signature"]
    signature_data = result["data"]
    signature_data_obj = json.loads(signature_data)

    after_ms = int(datetime.utcnow().timestamp() * 1000)

    assert signature_data_obj["cid"] == track_cid
    assert signature_data_obj["shouldCache"] == 1
    assert before_ms <= signature_data_obj["timestamp"] <= after_ms
    assert len(signature) == 132

    discovery_node_wallet = recover_wallet(
        json.loads(signature_data),
        signature,
    )

    assert discovery_node_wallet == shared_config["delegate"]["owner_wallet"]

    # make sure that "shouldCache" is not included in the signature for a gated track
    result = get_gated_content_signature(
        {
            "track_id": track_id,
            "cid": track_cid,
            "type": premium_content_type,
            "is_gated": True,
        }
    )
    signature_data = result["data"]
    signature_data_obj = json.loads(signature_data)

    assert "shouldCache" not in signature_data_obj


def test_signature_for_user_wallet():
    track_id = 1
    track_cid = "some-track-cid"
    premium_content_type = "track"
    user_wallet = (
        "0x954221ddae7ddf40871d57b98ce97c82782886d3"  # some staging user wallet
    )
    before_ms = int(datetime.utcnow().timestamp() * 1000)

    # for a non-gated track
    result = get_gated_content_signature_for_user_wallet(
        {
            "track_id": track_id,
            "track_cid": track_cid,
            "type": premium_content_type,
            "user_wallet": user_wallet,
            "is_gated": False,
        }
    )
    signature = result["signature"]
    signature_data = result["data"]
    signature_data_obj = json.loads(signature_data)

    after_ms = int(datetime.utcnow().timestamp() * 1000)

    assert signature_data_obj["cid"] == track_cid
    assert signature_data_obj["user_wallet"] == user_wallet
    assert signature_data_obj["shouldCache"] == 1
    assert before_ms <= signature_data_obj["timestamp"] <= after_ms
    assert len(signature) == 132

    discovery_node_wallet = recover_wallet(
        json.loads(signature_data),
        signature,
    )

    assert discovery_node_wallet == shared_config["delegate"]["owner_wallet"]

    # make sure that "shouldCache" is not included in the signature for a gated track
    result = get_gated_content_signature_for_user_wallet(
        {
            "track_id": track_id,
            "track_cid": track_cid,
            "type": premium_content_type,
            "user_wallet": user_wallet,
            "is_gated": True,
        }
    )
    signature_data = result["data"]
    signature_data_obj = json.loads(signature_data)

    assert "shouldCache" not in signature_data_obj


def test_signature_for_user_wallet_with_user_id():
    track_id = 1
    track_cid = "some-track-cid"
    premium_content_type = "track"
    user_wallet = (
        "0x954221ddae7ddf40871d57b98ce97c82782886d3"  # some staging user wallet
    )
    user_id = 1
    before_ms = int(datetime.utcnow().timestamp() * 1000)

    # for a non-gated track
    result = get_gated_content_signature_for_user_wallet(
        {
            "track_id": track_id,
            "track_cid": track_cid,
            "type": premium_content_type,
            "user_wallet": user_wallet,
            "user_id": user_id,
            "is_gated": False,
        }
    )
    signature = result["signature"]
    signature_data = result["data"]
    signature_data_obj = json.loads(signature_data)

    after_ms = int(datetime.utcnow().timestamp() * 1000)

    assert signature_data_obj["cid"] == track_cid
    assert signature_data_obj["user_wallet"] == user_wallet
    assert signature_data_obj["userId"] == user_id
    assert signature_data_obj["shouldCache"] == 1
    assert before_ms <= signature_data_obj["timestamp"] <= after_ms
    assert len(signature) == 132

    discovery_node_wallet = recover_wallet(
        json.loads(signature_data),
        signature,
    )

    assert discovery_node_wallet == shared_config["delegate"]["owner_wallet"]

    # make sure that "shouldCache" is not included in the signature for a gated track
    result = get_gated_content_signature_for_user_wallet(
        {
            "track_id": track_id,
            "track_cid": track_cid,
            "type": premium_content_type,
            "user_wallet": user_wallet,
            "user_id": user_id,
            "is_gated": True,
        }
    )
    signature_data = result["data"]
    signature_data_obj = json.loads(signature_data)

    assert "shouldCache" not in signature_data_obj
