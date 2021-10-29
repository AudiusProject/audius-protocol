import logging
import os
from urllib.parse import urljoin

from flask import redirect, request, url_for
from flask_restx import Namespace, Resource, reqparse
from src.api.v1.helpers import abort_bad_request_param, abort_not_found
from src.api.v1.utils.resolve_url import resolve_url
from src.utils import db_session

logger = logging.getLogger(__name__)

ns = Namespace("resolve", description="Audius Cannonical URL resolver")

resolve_route_parser = reqparse.RequestParser()
resolve_route_parser.add_argument("url", required=True)


@ns.route("")  # Root, no "/"
class Resolve(Resource):
    @ns.expect(resolve_route_parser)
    @ns.doc(
        id="""Resolve""",
        params={
            "url": "URL to resolve. Either fully formed URL (https://audius.co) or just the absolute path"
        },
        responses={302: "Internal redirect"},
    )
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
                    return abort_not_found(url)
                print(
                    "DEBUGGING HERE 1738",
                    resolved_url,
                    request.remote_addr,
                    request.host_url,
                )
                return redirect(urljoin(request.host_url, resolved_url), code=302)
        except Exception as e:
            logger.warning(e)
            abort_not_found(url, ns)
