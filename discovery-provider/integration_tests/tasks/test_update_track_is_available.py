import logging
from unittest import mock

from src.tasks.update_track_is_available import fetch_unavailable_track_ids

logger = logging.getLogger(__name__)


# Mock out request response
def _mock_response(json_data, status=200, raise_for_status=None):
    mock_resp = mock.Mock()

    mock_resp.json = mock.Mock(return_value=json_data)
    mock_resp.status_code = status

    mock_resp.raise_for_status = mock.Mock()
    if raise_for_status:
        mock_resp.raise_for_status.side_effect = raise_for_status

    return mock_resp


@mock.patch("src.tasks.update_track_is_available.requests")
def test_fetch(mock_requests, app):
    """
    Test fetching unavailable track ids from Content Node
    mock_get: reference to the mock requests.get
    look at test_index_tracks.py for ref
    """
    track_ids = [1, 2, 3, 4, 5, 6, 7]
    mock_return = {
        "data": {"values": track_ids},
        "signer": "signer",
        "timestamp": "2022-05-19T19:50:56.630Z",
        "signature": "signature",
    }

    mock_requests.get.return_value = _mock_response(mock_return, mock_return)

    fetch_response = fetch_unavailable_track_ids("http://content_node.com")

    assert fetch_response == track_ids
