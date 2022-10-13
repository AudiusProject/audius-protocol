from unittest.mock import ANY

from flask import Flask
from src.api.v1.users import UserTrackListenCountsMonthly

app = Flask(__name__)
# Bypasses the @marshal_with decorator
app.config["RESTX_MASK_HEADER"] = "*"

START_TIME = "2020-01-01"
END_TIME = "2021-01-01"


def test_user_listen_counts_monthly_get(mocker):
    listen_counts = {
        "2023-01-01": {
            "totalListens": 23,
            "trackIds": [3],
            "listenCounts": [
                {
                    "trackId": 3,
                    "date": "2023-01-01",
                    "listens": 23,
                }
            ],
        },
    }
    mock_get_user_listen_counts_monthly = mocker.patch(
        "src.api.v1.users.get_user_listen_counts_monthly", return_value=listen_counts
    )

    mock_decoder = mocker.patch("src.api.v1.users.decode_with_abort", return_value=3)

    mock_success_response = mocker.patch(
        "src.api.v1.users.success_response",
        # Cache decorator expects a tuple response
        side_effect=(lambda input: ({"data": input}, 200)),
    )
    with app.test_request_context(
        data={"start_time": START_TIME, "end_time": END_TIME},
    ):
        assert UserTrackListenCountsMonthly().get("id_to_decode") == (
            {"data": listen_counts},
            200,
            # Redis metrics add this empty dict
            {},
        )
        mock_decoder.assert_called_once_with("id_to_decode", ANY)
        mock_get_user_listen_counts_monthly.assert_called_once_with(
            {
                "user_id": 3,
                "start_time": START_TIME,
                "end_time": END_TIME,
            }
        )
        mock_success_response.assert_called_once_with(listen_counts)
