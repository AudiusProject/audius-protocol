import logging # pylint: disable=C0302
from datetime import datetime
from src.queries.get_genre_metrics import get_genre_metrics
from src.queries.get_plays_metrics import get_plays_metrics
from flask import Flask, Blueprint
from flask_restx import Resource, Namespace, fields, reqparse, inputs
from src.api.v1.helpers import make_response, success_response, to_dict, \
    parse_bool_param, parse_unix_epoch_param, abort_bad_request_param
from .models.metrics import route_metric, app_name_metric, app_name, plays_metric, genre_metric
from src.queries.get_route_metrics import get_route_metrics
from src.queries.get_app_name_metrics import get_app_name_metrics
from src.queries.get_app_names import get_app_names
from src.utils.redis_cache import cache

logger = logging.getLogger(__name__)

ns = Namespace('metrics', description='Metrics related operations')

route_metrics_response = make_response("metrics_reponse", ns, fields.List(fields.Nested(route_metric)))
app_name_response = make_response("app_name_response", ns, fields.List(fields.Nested(app_name)))
app_name_metrics_response = make_response("app_name_metrics_response", ns, fields.List(fields.Nested(app_name_metric)))
plays_metrics_response = make_response("plays_metrics", ns, fields.List(fields.Nested(plays_metric)))
genre_metrics_response = make_response("genre_metrics", ns, fields.List(fields.Nested(genre_metric)))

metrics_route_parser = reqparse.RequestParser()
metrics_route_parser.add_argument('path', required=False)
metrics_route_parser.add_argument('query_string', required=False)
metrics_route_parser.add_argument('start_time', required=False, type=int)
metrics_route_parser.add_argument('exact', required=False)
metrics_route_parser.add_argument('limit', required=False, type=int)
metrics_route_parser.add_argument('bucket_size', required=False)
metrics_route_parser.add_argument('version', required=False, action='append')

valid_date_buckets = ['hour', 'day', 'week', 'month', 'quarter', 'year', 'decade', 'century']

@ns.route("/routes", doc=False)
class RouteMetrics(Resource):
    @ns.expect(metrics_route_parser)
    @ns.doc(
        id="""Route Metrics""",
        params={
            'path': 'Request Path',
            'query_string': 'Query String',
            'start_time': 'Start Time in Unix Epoch',
            'exact': 'Exact Path Query Match',
            'limit': 'Limit',
            'bucket_size': 'Bucket Size',
            'version': 'API Version Query Filter'
        },
        responses={
            200: 'Success',
            400: 'Bad request',
            500: 'Server error'
        }
    )
    @ns.marshal_with(route_metrics_response)
    @cache(ttl_sec=30 * 60)
    def get(self):
        """Get the route metrics"""
        args = metrics_route_parser.parse_args()
        if args.get('limit') is None:
            args['limit'] = 168
        else:
            args['limit'] = min(args.get('limit'), 168)

        if args.get('bucket_size') is None:
            args['bucket_size'] = 'hour'
        if args.get('bucket_size') not in valid_date_buckets:
            abort_bad_request_param('bucket_size', ns)

        try:
            args['start_time'] = parse_unix_epoch_param(args.get('start_time'), 0)
        except:
            abort_bad_request_param('start_time', ns)

        if args.get('exact') is not None:
            args['exact'] = parse_bool_param(args.get('exact'))
            if args.get('exact') is None:
                abort_bad_request_param('exact', ns)
        else:
            args['exact'] = False

        args['path'] = args.get('path') if args.get('path') is not None else ''
        route_metrics = get_route_metrics(args)
        response = success_response(route_metrics)
        return response


metrics_app_name_list_parser = reqparse.RequestParser()
metrics_app_name_list_parser.add_argument('start_time', required=False, type=int)
metrics_app_name_list_parser.add_argument('limit', required=False, type=int)
metrics_app_name_list_parser.add_argument('offset', required=False, type=int)
metrics_app_name_list_parser.add_argument('include_unknown', required=False, type=inputs.boolean)

@ns.route("/app_name", doc=False)
class AppNameListMetrics(Resource):
    @ns.doc(
        id="""Get App Names""",
        params={
            'offset': 'Offset',
            'limit': 'Limit',
            'start_time': 'Start Time in Unix Epoch',
            'include_unknown': 'Whether or not to include unknown apps'
        },
        responses={
            200: 'Success',
            400: 'Bad request',
            500: 'Server error'
        }
    )
    @ns.expect(metrics_app_name_list_parser)
    @ns.marshal_with(app_name_response)
    @cache(ttl_sec=30 * 60)
    def get(self):
        """List all the app names"""
        args = metrics_app_name_list_parser.parse_args()
        if args.get('limit') is None:
            args['limit'] = 100
        else:
            args['limit'] = min(args.get('limit'), 100)
        if args.get('offset') is None:
            args['offset'] = 0
        try:
            args['start_time'] = parse_unix_epoch_param(args.get('start_time'), 0)
        except:
            abort_bad_request_param('start_time', ns)

        app_names = get_app_names(args)
        response = success_response(app_names)
        return response


metrics_app_name_parser = reqparse.RequestParser()
metrics_app_name_parser.add_argument('start_time', required=False, type=int)
metrics_app_name_parser.add_argument('limit', required=False, type=int)
metrics_app_name_parser.add_argument('bucket_size', required=False)

@ns.route("/app_name/<string:app_name>", doc=False)
class AppNameMetrics(Resource):
    @ns.doc(
        id="""Get Metrics by App Name""",
        params={
            'start_time': 'Start Time in Unix Epoch',
            'limit': 'Limit',
            'bucket_size': 'Bucket Size',
        },
        responses={
            200: 'Success',
            400: 'Bad request',
            500: 'Server error'
        }
    )
    @ns.expect(metrics_app_name_parser)
    @ns.marshal_with(app_name_metrics_response)
    @cache(ttl_sec=30 * 60)
    def get(self, app_name):
        """Get the app name metrics"""
        args = metrics_app_name_parser.parse_args()

        if args.get('limit') is None:
            args['limit'] = 168
        else:
            args['limit'] = min(args.get('limit'), 168)

        try:
            args['start_time'] = parse_unix_epoch_param(args.get('start_time'), 0)
        except:
            abort_bad_request_param('start_time', ns)

        if args.get('bucket_size') is None:
            args['bucket_size'] = 'hour'
        if args.get('bucket_size') not in valid_date_buckets:
            abort_bad_request_param('bucket_size', ns)

        app_name_metrics = get_app_name_metrics(app_name, args)
        response = success_response(app_name_metrics)
        return response


metrics_plays_parser = reqparse.RequestParser()
metrics_plays_parser.add_argument('start_time', required=False, type=int)
metrics_plays_parser.add_argument('limit', required=False, type=int)
metrics_plays_parser.add_argument('bucket_size', required=False)

@ns.route("/plays", doc=False)
class PlaysMetrics(Resource):
    @ns.doc(
        id="""Get Plays Metrics""",
        params={
            'start_time': 'Start Time in Unix Epoch',
            'limit': 'Limit',
            'bucket_size': 'Bucket Size',
        },
        responses={
            200: 'Success',
            400: 'Bad request',
            500: 'Server error'
        }
    )
    @ns.expect(metrics_plays_parser)
    @ns.marshal_with(plays_metrics_response)
    @cache(ttl_sec=30 * 60)
    def get(self):
        args = metrics_plays_parser.parse_args()

        if args.get('limit') is None:
            args['limit'] = 168
        else:
            args['limit'] = min(args.get('limit'), 168)

        try:
            args['start_time'] = parse_unix_epoch_param(args.get('start_time'), 0)
        except:
            abort_bad_request_param('start_time', ns)

        if args.get('bucket_size') is None:
            args['bucket_size'] = 'hour'
        if args.get('bucket_size') not in valid_date_buckets:
            abort_bad_request_param('bucket_size', ns)

        plays_metrics = get_plays_metrics(args)
        response = success_response(plays_metrics)
        return response


metrics_genres_parser = reqparse.RequestParser()
metrics_genres_parser.add_argument('start_time', required=False, type=int)
metrics_genres_parser.add_argument('limit', required=False, type=int)
metrics_genres_parser.add_argument('offset', required=False, type=int)

@ns.route("/genres", doc=False)
class GenreMetrics(Resource):
    @ns.doc(
        id="""Get Genre Metrics""",
        params={
            'offset': 'Offset',
            'limit': 'Limit',
            'start_time': 'Start Time in Unix Epoch'
        },
        responses={
            200: 'Success',
            400: 'Bad request',
            500: 'Server error'
        }
    )
    @ns.expect(metrics_genres_parser)
    @ns.marshal_with(genre_metrics_response)
    @cache(ttl_sec=30 * 60)
    def get(self):
        args = metrics_genres_parser.parse_args()

        if args.get('limit') is None:
            args['limit'] = 100
        else:
            args['limit'] = min(args.get('limit'), 100)
        if args.get('offset') is None:
            args['offset'] = 0
        try:
            args['start_time'] = parse_unix_epoch_param(args.get('start_time'), 0)
        except:
            abort_bad_request_param('start_time', ns)

        genre_metrics = get_genre_metrics(args)
        response = success_response(genre_metrics)
        return response
