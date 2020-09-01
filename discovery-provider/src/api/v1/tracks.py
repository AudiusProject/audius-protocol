from urllib.parse import urljoin
import logging  # pylint: disable=C0302
from flask import redirect
from flask_restx import Resource, Namespace, fields
from src.queries.get_tracks import get_tracks
from src.queries.get_track_user_creator_node import get_track_user_creator_node
from src.api.v1.helpers import abort_not_found, decode_with_abort,  \
    extend_track, make_response, search_parser, \
    trending_parser, success_response, abort_bad_request_param
from .models.tracks import track
from src.queries.search_queries import SearchKind, search
from src.queries.get_trending_tracks import get_trending_tracks
from src.utils.config import shared_config
from flask.json import dumps
from src.utils.redis_cache import cache
from src.utils.redis_metrics import record_metrics

import time

logger = logging.getLogger(__name__)
ns = Namespace('tracks', description='Track related operations')

track_response = make_response("track_response", ns, fields.Nested(track))
tracks_response = make_response(
    "tracks_response", ns, fields.List(fields.Nested(track)))

@ns.route('/<string:track_id>')
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
        decoded_id = decode_with_abort(track_id, ns)
        args = {"id": [decoded_id], "with_users": True, "filter_deleted": True}
        tracks = get_tracks(args)
        if not tracks:
            abort_not_found(track_id, ns)
        single_track = extend_track(tracks[0])
        return success_response(single_track)


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
        params={'query': 'Search Query'},
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
            "offset": 0
        }
        response = search(search_args)
        tracks = response["tracks"]
        tracks = list(map(extend_track, tracks))
        return success_response(tracks)


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
        time = args.get("time") if args.get("time") is not None else 'week'
        args = {
            'time': time,
            'genre': args.get("genre", None),
            'with_users': True
        }
        tracks = get_trending_tracks(args)
        tracks = list(map(extend_track, tracks))
        return success_response(tracks)
