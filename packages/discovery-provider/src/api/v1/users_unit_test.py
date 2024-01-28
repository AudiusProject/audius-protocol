import datetime
from unittest.mock import ANY, patch

from flask import Flask

from src.api.v1.users import UserTrackListenCountsMonthly

app = Flask(__name__)
# Bypasses the @marshal_with decorator
app.config["RESTX_MASK_HEADER"] = "*"

START_TIME = "2020-01-01"
END_TIME = "2021-01-01"


@patch(
    "src.api.v1.users.get_user_listen_counts_monthly",
    return_value=[
        {"play_item_id": 4, "timestamp": datetime.date(2022, 2, 1), "count": 10},
        {"play_item_id": 1, "timestamp": datetime.date(2022, 1, 1), "count": 7},
        {"play_item_id": 5, "timestamp": datetime.date(2022, 2, 1), "count": 8},
    ],
)
@patch(
    "src.api.v1.users.success_response",
    # Cache decorator expects a tuple response
    side_effect=(lambda input: ({"data": input}, 200)),
)
@patch("src.api.v1.users.decode_with_abort", return_value=3)
def test_user_listen_counts_monthly_get_formats_correctly(
    mock_decoder, mock_success_response, mock_get_user_listen_counts_monthly
):
    expected_formatted_listen_counts = {
        "2022-02-01T00:00:00Z": {
            "totalListens": 18,
            "trackIds": [4, 5],
            "listenCounts": [
                {
                    "trackId": 4,
                    "date": "2022-02-01T00:00:00Z",
                    "listens": 10,
                },
                {
                    "trackId": 5,
                    "date": "2022-02-01T00:00:00Z",
                    "listens": 8,
                },
            ],
        },
        "2022-01-01T00:00:00Z": {
            "totalListens": 7,
            "trackIds": [1],
            "listenCounts": [
                {
                    "trackId": 1,
                    "date": "2022-01-01T00:00:00Z",
                    "listens": 7,
                }
            ],
        },
    }
    with app.test_request_context(
        "/users/3jk4l/listen_counts_monthly",
        method="GET",
        data={"start_time": START_TIME, "end_time": END_TIME},
    ):
        assert UserTrackListenCountsMonthly().get("3jk4l") == (
            {"data": expected_formatted_listen_counts},
            200,
            # Redis metrics add this empty dict
            {},
        )
        mock_decoder.assert_called_once_with("3jk4l", ANY)
        mock_get_user_listen_counts_monthly.assert_called_once_with(
            {
                "user_id": 3,
                "start_time": START_TIME,
                "end_time": END_TIME,
            }
        )
        mock_success_response.assert_called_once_with(expected_formatted_listen_counts)


@patch("src.api.v1.users.get_user_listen_counts_monthly", return_value=[])
@patch(
    "src.api.v1.users.success_response",
    # Cache decorator expects a tuple response
    side_effect=(lambda input: ({"data": input}, 200)),
)
@patch("src.api.v1.users.decode_with_abort", return_value=5)
def test_user_listen_counts_monthly_get_no_data(
    mock_decoder, mock_success_response, mock_get_user_listen_counts_monthly
):
    with app.test_request_context(
        "/users/feafda/listen_counts_monthly",
        method="GET",
        data={"start_time": START_TIME, "end_time": END_TIME},
    ):
        data = UserTrackListenCountsMonthly().get("feafda")
        assert data == (
            {"data": {}},
            200,
            # Redis metrics add this empty dict
            {},
        )
        mock_decoder.assert_called_once_with("feafda", ANY)
        mock_get_user_listen_counts_monthly.assert_called_once_with(
            {
                "user_id": 5,
                "start_time": START_TIME,
                "end_time": END_TIME,
            }
        )
        mock_success_response.assert_called_once_with({})
