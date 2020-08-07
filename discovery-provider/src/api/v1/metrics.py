import logging # pylint: disable=C0302
from datetime import datetime
from flask import Flask, Blueprint
from flask_restx import Resource, Namespace, fields, reqparse
from src import api_helpers
from src.api.v1.helpers import make_response, success_response, to_dict
from .models.metrics import route_metric, app_name_metric, app_name
from src.queries.get_route_metrics import get_route_metrics
from src.queries.get_app_name_metrics import get_app_name_metrics
from src.queries.get_app_names import get_app_names

logger = logging.getLogger(__name__)

ns = Namespace('metrics', description='Metrics related operations')

route_metrics_response = make_response("metrics_reponse", ns, fields.List(fields.Nested(route_metric)))
app_name_response = make_response("app_name_response", ns, fields.List(fields.Nested(app_name)))
app_name_metrics_response = make_response("app_name_metrics_response", ns, fields.List(fields.Nested(app_name_metric)))

metrics_route_parser = reqparse.RequestParser()
metrics_route_parser.add_argument('path', required=True)
metrics_route_parser.add_argument('query_string', required=False)
metrics_route_parser.add_argument('start_time', required=True, type=int)
metrics_route_parser.add_argument('limit', required=False, type=int)
metrics_route_parser.add_argument('version', required=False, action='append')

@ns.route("/routes", doc=False)
class RouteMetrics(Resource):
    @ns.expect(metrics_route_parser)
    @ns.marshal_with(route_metrics_response)
    def get(self):
        """Get the route metrics"""
        args = metrics_route_parser.parse_args()
        if args.get('limit') is None:
            args['limit'] = 48
        else:
            args['limit'] = min(args.get('limit'), 48)
        try:
            args['start_time'] = datetime.utcfromtimestamp(args['start_time'])
        except:
            return api_helpers.error_response('Poorly formated start_time parameter', 400)

        route_metrics = get_route_metrics(args)
        response = success_response(route_metrics)
        return response


metrics_app_name_list_parser = reqparse.RequestParser()
metrics_app_name_list_parser.add_argument('limit', required=False, type=int)
metrics_app_name_list_parser.add_argument('offset', required=False, type=int)

@ns.route("/app_name", doc=False)
class AppNameListMetrics(Resource):
    @ns.expect(metrics_app_name_list_parser)
    @ns.marshal_with(app_name_response)
    def get(self):
        """List all the app names"""
        args = metrics_app_name_list_parser.parse_args()
        if args.get('limit') is None:
            args['limit'] = 100
        else:
            args['limit'] = min(args.get('limit'), 100)
        if args.get('offset') is None:
            args['offset'] = 0

        app_names = get_app_names(args)
        response = success_response(app_names)
        return response


metrics_app_name_parser = reqparse.RequestParser()
metrics_app_name_parser.add_argument('start_time', required=True, type=int)
metrics_app_name_parser.add_argument('limit', required=False, type=int)

@ns.route("/app_name/<string:app_name>", doc=False)
class AppNameMetrics(Resource):
    @ns.expect(metrics_app_name_parser)
    @ns.marshal_with(app_name_metrics_response)
    def get(self, app_name):
        """Get the app name metrics"""
        args = metrics_app_name_parser.parse_args()
        if args.get('limit') is None:
            args['limit'] = 48
        else:
            args['limit'] = min(args.get('limit'), 48)
        try:
            args['start_time'] = datetime.utcfromtimestamp(args['start_time'])
        except:
            return api_helpers.error_response('Poorly formated start_time parameter', 400)
        app_name_metrics = get_app_name_metrics(app_name, args)
        response = success_response(app_name_metrics)
        return response

