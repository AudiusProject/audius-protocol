import logging
from flask import redirect
from flask_restx import Resource, Namespace, reqparse
from src.api.v1.helpers import abort_bad_request_param, abort_not_found
from src.api.v1.utils.resolve_url import resolve_url
from src.utils import db_session


logger = logging.getLogger(__name__)

ns = Namespace('resolve', description='Audius Cannonical URL resolver')

resolve_route_parser = reqparse.RequestParser()
resolve_route_parser.add_argument('url', required=True)


@ns.route("")  # Root, no "/"
class Resolve(Resource):
    @ns.expect(resolve_route_parser)
    @ns.doc(
        id="""Resolve""",
        params={
            'url': 'Url to resolve. Either fully formed with protocol and domain or the absolute path'
        },
        responses={
            307: 'Internal redirect'
        }
    )
    def get(self):
        """
        Resolves a provided Audius app URL to the canonical API resource it represents.

        This endpoint returns a 307 redirect to the canonical API route.
        Follow the redirect to request the resource from the API.
        Tracks, Playlists, and Users are supported.
        """
        args = resolve_route_parser.parse_args()
        url = args.get("url")
        if not url:
            abort_bad_request_param('url', ns)
        try:
            db = db_session.get_db_read_replica()
            with db.scoped_session() as session:
                resolved_url = resolve_url(session, url)
                if not resolved_url:
                    return abort_not_found(url)

                return redirect(resolved_url, code=307)

        except Exception as e:
            logger.warning(e)
            abort_not_found(url, ns)
