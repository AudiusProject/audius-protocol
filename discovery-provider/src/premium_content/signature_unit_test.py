import json
from datetime import datetime

from src.api_helpers import recover_wallet
from src.premium_content.signature import get_premium_content_signature
from src.utils.config import shared_config


def test_signature():
    premium_content_id = 1
    premium_content_type = "track"
    user_wallet = (
        "0x954221ddae7ddf40871d57b98ce97c82782886d3"  # some staging user wallet
    )
    before_ms = int(datetime.utcnow().timestamp() * 1000)

    result = get_premium_content_signature(
        {
            "id": premium_content_id,
            "type": premium_content_type,
            "user_wallet": user_wallet,
        }
    )
    signature = result["signature"]
    signature_data = result["data"]
    signature_data_obj = json.loads(signature_data)

    after_ms = int(datetime.utcnow().timestamp() * 1000)

    assert signature_data_obj["premium_content_id"] == premium_content_id
    assert signature_data_obj["premium_content_type"] == premium_content_type
    assert signature_data_obj["user_wallet"] == user_wallet
    assert before_ms <= signature_data_obj["timestamp"] <= after_ms
    assert len(signature) == 132

    discovery_node_wallet = recover_wallet(
        json.loads(signature_data),
        signature,
    )

    assert discovery_node_wallet == shared_config["delegate"]["owner_wallet"]
