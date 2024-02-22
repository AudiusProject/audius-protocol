import logging

from flask_restx import Namespace, Resource, fields, reqparse

from src.api.v1.helpers import (
    DescriptiveArgument,
    abort_bad_path_param,
    abort_bad_request_param,
    format_limit,
    make_response,
    parse_unix_epoch_param,
    parse_unix_epoch_param_non_utc,
    success_response,
)
from src.queries.get_aggregate_route_metrics import get_aggregate_route_metrics
from src.queries.get_app_name_metrics import (
    get_aggregate_app_metrics,
    get_historical_app_metrics,
)
from src.queries.get_genre_metrics import get_genre_metrics
from src.queries.get_historical_route_metrics import get_historical_route_metrics
from src.queries.get_personal_route_metrics import get_personal_route_metrics
from src.queries.get_plays_metrics import get_plays_metrics
from src.queries.get_trailing_metrics import get_aggregate_route_metrics_trailing
from src.utils.redis_cache import cache
from src.utils.redis_metrics import (
    get_aggregate_metrics_info,
    get_redis_app_metrics,
    get_redis_route_metrics,
    get_summed_unique_metrics,
)

from .models.metrics import genre_metric, plays_metric

logger = logging.getLogger(__name__)


ns = Namespace("metrics", description="Metrics related operations")

plays_metrics_response = make_response(
    "plays_metrics", ns, fields.List(fields.Nested(plays_metric))
)
genre_metrics_response = make_response(
    "genre_metrics", ns, fields.List(fields.Nested(genre_metric))
)

metrics_route_parser = reqparse.RequestParser()
metrics_route_parser.add_argument("path", required=False)
metrics_route_parser.add_argument("query_string", required=False)
metrics_route_parser.add_argument("start_time", required=False, type=int)
metrics_route_parser.add_argument("exact", required=False)
metrics_route_parser.add_argument("limit", required=False, type=int)
metrics_route_parser.add_argument("bucket_size", required=False)
metrics_route_parser.add_argument("version", required=False, action="append")

valid_date_buckets = [
    "hour",
    "day",
    "week",
    "month",
    "quarter",
    "year",
    "decade",
    "century",
]
valid_bucket_sizes = {
    "week": ["day"],
    "month": ["day", "week"],
    "all_time": ["month", "week"],
}
valid_bucket_sizes_with_year = {
    "week": ["day"],
    "month": ["day", "week"],
    "year": ["month"],
    "all_time": ["month", "week"],
}


personal_route_metrics_parser = reqparse.RequestParser()
personal_route_metrics_parser.add_argument("bucket_size", required=False)


@ns.route("/routes/<string:time_range>", doc=False)
class PersonalRouteMetrics(Resource):
    @ns.doc(
        id="""Personal Route Metrics""",
        params={
            "bucket_size": "Grouping of route metrics (e.g. by day, week, or month) for given time range"
        },
        responses={200: "Success", 400: "Bad request", 500: "Server error"},
    )
    @cache(ttl_sec=30 * 60)
    def get(self, time_range):
        """Gets node's personal route metrics based on time range and bucket size"""
        if time_range not in valid_bucket_sizes:
            abort_bad_path_param("time_range", ns)

        args = personal_route_metrics_parser.parse_args()
        valid_buckets = valid_bucket_sizes[time_range]
        bucket_size = args.get("bucket_size") or valid_buckets[0]

        if bucket_size not in valid_buckets:
            abort_bad_request_param("bucket_size", ns)

        metrics = get_personal_route_metrics(time_range, bucket_size)
        response = success_response(metrics)
        return response


@ns.route("/routes/cached", doc=False)
class CachedRouteMetrics(Resource):
    @ns.doc(
        id="""Cached Route Metrics""",
        params={"start_time": "Start Time in Unix Epoch"},
        responses={200: "Success", 400: "Bad request", 500: "Server error"},
    )
    @cache(ttl_sec=5)
    def get(self):
        args = metrics_route_parser.parse_args()
        start_time = parse_unix_epoch_param_non_utc(args.get("start_time"))
        deduped_metrics = get_redis_route_metrics(start_time)
        summed_metrics = get_summed_unique_metrics(start_time)
        metrics = {"deduped": deduped_metrics, "summed": summed_metrics}
        response = success_response(metrics)
        return response


@ns.route("/apps/cached", doc=False)
class CachedAppMetrics(Resource):
    @ns.doc(
        id="""Cached App Metrics""",
        params={"start_time": "Start Time in Unix Epoch"},
        responses={200: "Success", 400: "Bad request", 500: "Server error"},
    )
    @cache(ttl_sec=5)
    def get(self):
        args = metrics_route_parser.parse_args()
        start_time = parse_unix_epoch_param_non_utc(args.get("start_time"))
        metrics = get_redis_app_metrics(start_time)
        response = success_response(metrics)
        return response


@ns.route("/aggregates/info", doc=False)
class AggregateMetricsInfo(Resource):
    @cache(ttl_sec=5)
    def get(self):
        """Gets aggregate metrics information"""
        metrics_info = get_aggregate_metrics_info()
        response = success_response(metrics_info)
        return response


@ns.route("/aggregates/historical", doc=False)
class AggregateHistoricalMetrics(Resource):
    @cache(ttl_sec=30 * 60)
    def get(self):
        """Gets historical aggregate metrics"""
        historical_metrics = {
            "routes": get_historical_route_metrics(),
            "apps": get_historical_app_metrics(),
        }
        response = success_response(historical_metrics)
        return response


@ns.route("/aggregates/routes/trailing/<string:time_range>", doc=False)
class AggregateRouteMetricsTrailingMonth(Resource):
    @cache(ttl_sec=30 * 60)
    def get(self, time_range):
        """Gets aggregated route metrics for the last trailing month or year"""
        if time_range != "month" and time_range != "year":
            abort_bad_path_param("time_range", ns)
        metrics = get_aggregate_route_metrics_trailing(time_range)
        response = success_response(metrics)
        return response


aggregate_route_metrics_parser = reqparse.RequestParser()
aggregate_route_metrics_parser.add_argument("bucket_size", required=False)


@ns.route("/aggregates/routes/<string:time_range>", doc=False)
class AggregateRouteMetrics(Resource):
    @ns.doc(
        id="""Aggregate Route Metrics""",
        params={
            "bucket_size": "Grouping of route metrics (e.g. by day, week, or month) for given time range"
        },
        responses={200: "Success", 400: "Bad request", 500: "Server error"},
    )
    @cache(ttl_sec=30 * 60)
    def get(self, time_range):
        """Gets aggregated route metrics based on time range and bucket size"""
        if time_range not in valid_bucket_sizes_with_year:
            abort_bad_path_param("time_range", ns)

        args = aggregate_route_metrics_parser.parse_args()
        valid_buckets = valid_bucket_sizes_with_year[time_range]
        bucket_size = args.get("bucket_size") or valid_buckets[0]

        if bucket_size not in valid_buckets:
            abort_bad_request_param("bucket_size", ns)

        metrics = get_aggregate_route_metrics(time_range, bucket_size)
        response = success_response(metrics)
        return response


aggregate_app_metrics_parser = reqparse.RequestParser()
aggregate_app_metrics_parser.add_argument("limit", required=False)


@ns.route("/aggregates/apps/<string:time_range>", doc=False)
class AggregateAppMetricsTrailing(Resource):
    @ns.doc(
        id="""Aggregate App Metrics""",
        params={"limit": "Maximum number of apps to return"},
        responses={200: "Success", 400: "Bad request", 500: "Server error"},
    )
    @cache(ttl_sec=30 * 60)
    def get(self, time_range):
        """Gets aggregated app metrics based on time range and bucket size"""
        if time_range not in valid_bucket_sizes_with_year:
            abort_bad_path_param("time_range", ns)

        args = aggregate_app_metrics_parser.parse_args()
        limit = format_limit(args, max_limit=100)
        metrics = get_aggregate_app_metrics(time_range, limit)
        response = success_response(metrics)
        return response


valid_trailing_time_periods = ["week", "month", "all_time"]
trailing_app_name_parser = reqparse.RequestParser(argument_class=DescriptiveArgument)
trailing_app_name_parser.add_argument(
    "limit", required=False, type=int, description="The number of apps to get"
)
trailing_app_name_parser.add_argument(
    "time_range",
    required=False,
    type=str,
    choices=valid_trailing_time_periods,
    location="path",
    description="The trailing time period",
)


metrics_plays_parser = reqparse.RequestParser()
metrics_plays_parser.add_argument("start_time", required=False, type=int)
metrics_plays_parser.add_argument("limit", required=False, type=int)
metrics_plays_parser.add_argument("bucket_size", required=False)


@ns.route("/plays", doc=False)
class PlaysMetrics(Resource):
    @ns.doc(
        id="""Get Plays Metrics""",
        params={
            "start_time": "Start Time in Unix Epoch",
            "limit": "Limit",
            "bucket_size": "Bucket Size",
        },
        responses={200: "Success", 400: "Bad request", 500: "Server error"},
    )
    @ns.expect(metrics_plays_parser)
    @ns.marshal_with(plays_metrics_response)
    @cache(ttl_sec=3 * 60 * 60)
    def get(self):
        args = metrics_plays_parser.parse_args()

        if args.get("limit") is None:
            args["limit"] = 168
        else:
            args["limit"] = min(args.get("limit"), 168)

        try:
            args["start_time"] = parse_unix_epoch_param(args.get("start_time"), 0)
        except Exception:
            abort_bad_request_param("start_time", ns)

        if args.get("bucket_size") is None:
            args["bucket_size"] = "hour"
        if args.get("bucket_size") not in valid_date_buckets:
            abort_bad_request_param("bucket_size", ns)

        plays_metrics = get_plays_metrics(args)
        response = success_response(plays_metrics)
        return response


metrics_genres_parser = reqparse.RequestParser()
metrics_genres_parser.add_argument("start_time", required=False, type=int)
metrics_genres_parser.add_argument("limit", required=False, type=int)
metrics_genres_parser.add_argument("offset", required=False, type=int)


@ns.route("/genres", doc=False)
class GenreMetrics(Resource):
    @ns.doc(
        id="""Get Genre Metrics""",
        params={
            "offset": "Offset",
            "limit": "Limit",
            "start_time": "Start Time in Unix Epoch",
        },
        responses={200: "Success", 400: "Bad request", 500: "Server error"},
    )
    @ns.expect(metrics_genres_parser)
    @ns.marshal_with(genre_metrics_response)
    @cache(ttl_sec=3 * 60 * 60)
    def get(self):
        args = metrics_genres_parser.parse_args()

        if args.get("limit") is None:
            args["limit"] = 100
        else:
            args["limit"] = min(args.get("limit"), 100)
        if args.get("offset") is None:
            args["offset"] = 0
        try:
            args["start_time"] = parse_unix_epoch_param(args.get("start_time"), 0)
        except Exception:
            abort_bad_request_param("start_time", ns)

        genre_metrics = get_genre_metrics(args)
        response = success_response(genre_metrics)
        return response
