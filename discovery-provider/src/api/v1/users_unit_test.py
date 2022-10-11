from flask import Flask
from src.api.v1.users import UserTrackListenCountsMonthly
from src.models.social.aggregate_monthly_plays import AggregateMonthlyPlay

app = Flask(__name__)
START_TIME = "2020-01-01"
END_TIME = "2021-01-01"


def test_user_listen_counts_monthly_get(mocker):
    mock_get_user_listen_counts_monthly = mocker.patch(
        "src.api.v1.users.get_user_listen_counts_monthly",
        return_value=[
            AggregateMonthlyPlay(timestamp="2022-01-01", play_item_id=3, count=2),
            AggregateMonthlyPlay(timestamp="2023-01-01", play_item_id=3, count=23),
        ],
    )

    mock_success_response = mocker.patch(
        "src.api.v1.users.success_response", side_effect=(lambda input: {"data": input})
    )
    with app.test_request_context(
        data={"start_time": START_TIME, "end_time": END_TIME}
    ):
        expected_formatted_data = {
            "2022-01-01": {
                "totalListens": 2,
                "trackIds": [3],
                "listenCounts": [
                    {
                        "trackId": 3,
                        "date": "2022-01-01",
                        "listens": 2,
                    }
                ],
            },
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
        print("here!!")
        lc = UserTrackListenCountsMonthly()
        print(lc.get.__wrapped__(lc, 3))
        assert UserTrackListenCountsMonthly().get(3) == {
            "data": expected_formatted_data
        }
        mock_get_user_listen_counts_monthly.assert_called_once_with(
            {
                "user_id": 3,
                "start_time": START_TIME,
                "end_time": END_TIME,
            }
        )
        mock_success_response.assert_called_once_with(expected_formatted_data)


# def test_user_listen_counts_monthly_get_sums_total_listens(mocker):
#     mocker.patch(
#         "src.api.v1.users.get_user_listen_counts_monthly",
#         return_value=[
#             AggregateMonthlyPlay(timestamp="2022-01-01", play_item_id=3, count=2),
#             AggregateMonthlyPlay(timestamp="2022-01-01", play_item_id=4, count=23),
#         ],
#     )
#     mocker.patch(
#         "src.api.v1.users.success_response", side_effect=(lambda input: {"data": input})
#     )
#     with app.test_request_context(
#         data={"start_time": START_TIME, "end_time": END_TIME}
#     ):
#         assert UserTrackListenCountsMonthly().get(2) == {
#             "data": {
#                 "2022-01-01": {
#                     "totalListens": 25,
#                     "trackIds": [3, 4],
#                     "listenCounts": [
#                         {
#                             "trackId": 3,
#                             "date": "2022-01-01",
#                             "listens": 2,
#                         },
#                         {
#                             "trackId": 4,
#                             "date": "2022-01-01",
#                             "listens": 23,
#                         },
#                     ],
#                 },
#             }
#         }


# def test_user_listen_counts_monthly_get_no_results(mocker):
#     mocker.patch(
#         "src.api.v1.users.get_user_listen_counts_monthly",
#         return_value=[],
#     )
#     mocker.patch(
#         "src.api.v1.users.success_response", side_effect=(lambda input: {"data": input})
#     )
#     with app.test_request_context(
#         data={"start_time": START_TIME, "end_time": END_TIME}
#     ):
#         assert UserTrackListenCountsMonthly().get(2) == {"data": {}}
