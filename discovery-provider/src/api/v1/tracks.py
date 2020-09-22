from urllib.parse import urljoin
import logging  # pylint: disable=C0302
from flask import redirect
from flask_restx import Resource, Namespace, fields
from flask_restx import resource
import json
from src.queries.get_tracks import get_tracks
from src.queries.get_track_user_creator_node import get_track_user_creator_node
from src.api.v1.helpers import abort_not_found, decode_with_abort,  \
    extend_track, make_response, search_parser, \
    trending_parser, full_trending_parser, success_response, abort_bad_request_param, to_dict, \
    format_offset, decode_string_id
from .models.tracks import track, track_full
from src.queries.search_queries import SearchKind, search
from src.queries.get_trending_tracks import get_trending_tracks
from flask.json import dumps
from src.utils.redis_cache import cache, extract_key, use_redis_cache
from src.utils import redis_connection
from flask.globals import request
from src.utils.redis_metrics import record_metrics

logger = logging.getLogger(__name__)
ns = Namespace('tracks', description='Track related operations')
full_ns = Namespace('tracks', description='Full track operations')

track_response = make_response("track_response", ns, fields.Nested(track))
full_track_response = make_response("full_track_response", full_ns, fields.Nested(track_full))

tracks_response = make_response(
    "tracks_response", ns, fields.List(fields.Nested(track)))
full_tracks_response = make_response(
    "full_tracks_response", full_ns, fields.List(fields.Nested(track_full))
)

def get_single_track(track_id, endpoint_ns):
    decoded_id = decode_with_abort(track_id, endpoint_ns)
    args = {"id": [decoded_id], "with_users": True, "filter_deleted": True}
    tracks = get_tracks(args)
    if not tracks:
        abort_not_found(track_id, endpoint_ns)
    single_track = extend_track(tracks[0])
    return success_response(single_track)

TRACK_ROUTE = '/<string:track_id>'
@ns.route(TRACK_ROUTE)
class Track(Resource):
    @record_metrics
    @ns.doc(
        id="""Get Track""",
        params={'track_id': 'A Track ID'},
        responses={
            200: 'Success',
            400: 'Bad request',
            500: 'Server error'
        }
    )
    @ns.marshal_with(track_response)
    @cache(ttl_sec=5)
    def get(self, track_id):
        """Fetch a track."""
        return get_single_track(track_id, ns)

@full_ns.route(TRACK_ROUTE)
class FullTrack(Resource):
    @record_metrics
    @full_ns.marshal_with(full_track_response)
    @cache(ttl_sec=5)
    def get(self, track_id):
        return get_single_track(track_id, full_ns)

def tranform_stream_cache(stream_url):
    return redirect(stream_url)

@ns.route("/<string:track_id>/stream")
class TrackStream(Resource):
    @record_metrics
    @ns.doc(
        id="""Stream Track""",
        params={'track_id': 'A Track ID'},
        responses={
            200: 'Success',
            216: 'Partial content',
            400: 'Bad request',
            416: 'Content range invalid',
            500: 'Server error'
        }
    )
    @cache(ttl_sec=5, transform=tranform_stream_cache)
    def get(self, track_id):
        """
        Get the track's streamable mp3 file.

        This endpoint accepts the Range header for streaming.
        https://developer.mozilla.org/en-US/docs/Web/HTTP/Range_requests
        """
        decoded_id = decode_with_abort(track_id, ns)
        args = {"track_id": decoded_id}
        creator_nodes = get_track_user_creator_node(args)
        if creator_nodes is None:
            abort_not_found(track_id, ns)
        creator_nodes = creator_nodes.split(',')
        if not creator_nodes:
            abort_not_found(track_id, ns)

        primary_node = creator_nodes[0]
        stream_url = urljoin(primary_node, 'tracks/stream/{}'.format(track_id))

        return stream_url

track_search_result = make_response(
    "track_search", ns, fields.List(fields.Nested(track)))

@ns.route("/search")
class TrackSearchResult(Resource):
    @record_metrics
    @ns.doc(
        id="""Search Tracks""",
        params={
            'query': 'Search Query',
            'only_downloadable': 'Return only downloadable tracks'
        },
        responses={
            200: 'Success',
            400: 'Bad request',
            500: 'Server error'
        }
    )
    @ns.marshal_with(track_search_result)
    @ns.expect(search_parser)
    @cache(ttl_sec=60)
    def get(self):
        """Search for a track."""
        args = search_parser.parse_args()
        query = args["query"]
        if not query:
            abort_bad_request_param('query', ns)
        search_args = {
            "query": query,
            "kind": SearchKind.tracks.name,
            "is_auto_complete": False,
            "current_user_id": None,
            "with_users": True,
            "limit": 10,
            "offset": 0,
            "only_downloadable": args["only_downloadable"]
        }
        response = search(search_args)
        tracks = response["tracks"]
        tracks = list(map(extend_track, tracks))
        return success_response(tracks)


TRENDING_LIMIT = 100

def get_trending(args):
    time = args.get("time") if args.get("time") is not None else 'week'
    current_user_id = args.get("user_id")
    args = {
        'time': time,
        'genre': args.get("genre", None),
        'with_users': True,
        'limit': TRENDING_LIMIT,
        'offset': format_offset(args, TRENDING_LIMIT)
    }
    if (current_user_id):
        decoded_id = decode_string_id(current_user_id)
        args["current_user_id"] = decoded_id
    tracks = get_trending_tracks(args)
    return list(map(extend_track, tracks))

@ns.route("/trending")
class Trending(Resource):
    @record_metrics
    @ns.doc(
        id="""Trending Tracks""",
        params={
            'genre': 'Trending tracks for a specified genre',
            'time': 'Trending tracks over a specified time range (week, month, allTime)'
        },
        responses={
            200: 'Success',
            400: 'Bad request',
            500: 'Server error'
        }
    )
    @ns.marshal_with(tracks_response)
    @cache(ttl_sec=30 * 60)
    def get(self):
        """Gets the top 100 trending (most popular) tracks on Audius"""
        args = trending_parser.parse_args()
        trending = get_trending(args)
        return success_response(trending)


TRENDING_TTL_SEC = 60

@full_ns.route("/trending")
class FullTrending(Resource):
    def get_cache_key(self):
        request_items = to_dict(request.args)
        request_items.pop('limit')
        request_items.pop('offset')
        key = extract_key(request.path, request_items.items())
        return key

    @full_ns.marshal_with(full_tracks_response)
    def get(self):
        args = full_trending_parser.parse_args()
        offset = int(args.get('offset', 0))
        limit = min(int(args.get('limit', 10)), TRENDING_LIMIT)
        key = self.get_cache_key()

        full_trending = use_redis_cache(key, TRENDING_TTL_SEC, lambda: get_trending(args))
        trending = full_trending[offset: limit + offset]
        return success_response(trending)

