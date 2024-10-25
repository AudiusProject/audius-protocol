import logging

from flask import redirect, make_response
from flask_restx import Namespace, Resource, reqparse
from flask_cors import cross_origin

from src.api.v1.helpers import (
    DescriptiveArgument,
    abort_bad_request_param,
    abort_not_found,
)
from src.api.v1.utils.resolve_url import resolve_url
from src.utils import db_session

logger = logging.getLogger(__name__)

ns = Namespace("resolve", description="Audius Cannonical URL resolver")

resolve_route_parser = reqparse.RequestParser(argument_class=DescriptiveArgument)
resolve_route_parser.add_argument(
    "url",
    required=True,
    description="URL to resolve. Either fully formed URL (https://audius.co) or just the absolute path",
)


@ns.route("")  # Root, no "/"
class Resolve(Resource):
    @ns.doc(
        id="""Resolve""",
        responses={302: "Internal redirect"},
    )
    @ns.expect(resolve_route_parser)
    @cross_origin()
    def get(self):
        """
        Resolves and redirects a provided Audius app URL to the API resource URL it represents.

        This endpoint allows you to lookup and access API resources when you only know the
        audius.co URL.
        Tracks, Playlists, and Users are supported.
        """
        args = resolve_route_parser.parse_args()
        url = args.get("url")
        if not url:
            abort_bad_request_param("url", ns)
        try:
            db = db_session.get_db_read_replica()
            with db.scoped_session() as session:
                resolved_url = resolve_url(session, url)
                if not resolved_url:
                    return abort_not_found(url, ns)

                response = make_response(redirect(resolved_url, code=302))
                response.headers['Access-Control-Allow-Origin'] = '*'
                return response

        except Exception as e:
            logger.warning(e)
            abort_not_found(url, ns)
