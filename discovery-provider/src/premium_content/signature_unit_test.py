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

    after_ms = int(datetime.utcnow().timestamp() * 1000)

    assert result["data"]["premium_content_id"] == premium_content_id
    assert result["data"]["premium_content_type"] == premium_content_type
    assert result["data"]["user_wallet"] == user_wallet
    assert before_ms <= result["data"]["timestamp"] <= after_ms
    assert len(result["signature"]) == 132

    discovery_node_wallet = recover_wallet(
        result["data"],
        result["signature"],
    )

    assert discovery_node_wallet == shared_config["delegate"]["owner_wallet"]
