import logging
from unittest import mock

from src.tasks.update_track_is_available import (  # _update_track_is_available,
    fetch_unavailable_track_ids,
)

logger = logging.getLogger(__name__)

# Mock out request response
def _mock_response(self, json_data, status=200, raise_for_status=None):  # Error type
    mock_resp = mock.Mock()

    mock_resp.json = mock.Mock(return_value=json_data)
    mock_resp.status_code = status

    mock_resp.raise_for_status = mock.Mock()
    if raise_for_status:
        mock_resp.raise_for_status.side_effect = raise_for_status

    return mock_resp


@mock.patch("src.tasks.update_track_is_available.requests.get")
def test_fetch(self, mock_get):
    """ "
    Test fetching unavailable track ids from Content Node
    mock_get: reference to the mock requests.get
    """
    track_ids = ["1", "2", "3", "4", "5", "6", "7"]
    mock_return = {
        "data": {"values": track_ids},
        "signer": "signer",
        "timestamp": "2022-05-19T19:50:56.630Z",
        "signature": "signature",
    }
    # mock_resp = self._mock_response({'data': {'values': ['1', '2', '3', '4', '5', '6', '7']}, 'signer': '0x22d491bde2303f2f43325b2108d26f1eaba1e32b', 'timestamp': '2022-05-19T19:50:56.630Z', 'signature': '0x01c42b12498f42d0daddf2e3421592513a1c7243aaf9d4735474f3164c38f9ce6703e33bf7114cac1caee2894dcce61d53b23f5e4b7a5fc7290b73228befabab1c'})
    mock_get.return_value = self._mock_response(mock_return)

    fetch_response = fetch_unavailable_track_ids("http://content_node.com")
    self.assertEqual(fetch_response, track_ids)
