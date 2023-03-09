import logging

logger = logging.getLogger(__name__)


def test_get_acdc_status(client):
    response = client.get("/acdc")
    assert response.status_code == 200

    json = response.json["data"]
    logger.info(json)

    # assert all keys are present
    assert "current_block" in json
    assert "current_block_number" in json
    assert "signers" in json
    assert "signers_count" in json
    assert "snapshot" in json
    assert "me" in json
    assert "is_signer" in json
    assert "health" in json
