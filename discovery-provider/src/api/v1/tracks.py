from urllib.parse import urljoin
import logging  # pylint: disable=C0302
from flask import redirect
from flask_restx import Resource, Namespace, fields
from src.queries.get_tracks import get_tracks
from src.queries.get_track_user_creator_node import get_track_user_creator_node
from src.api.v1.helpers import abort_not_found, decode_with_abort, encode_int_id, \
    extend_favorite, extend_track, extend_user, make_response, search_parser, \
    trending_parser, success_response
from .models.tracks import track
from src.queries.search_queries import SearchKind, search
from src.queries.get_trending_tracks import get_trending_tracks
import redis
import json
from src.utils.config import shared_config
from flask.json import dumps
import functools
from src.utils.redis_cache import cached
from src.utils.redis_cache import cache


REDIS_URL = shared_config["redis"]["url"]
REDIS = redis.Redis.from_url(url=REDIS_URL)

logger = logging.getLogger(__name__)
ns = Namespace('tracks', description='Track related operations')

track_response = make_response("track_response", ns, fields.Nested(track))
tracks_response = make_response(
    "tracks_response", ns, fields.List(fields.Nested(track)))


@ns.route('/<string:track_id>')
class Track(Resource):
    @ns.marshal_with(track_response)
    @cache(ttl_sec=5)
    def get(self, track_id):
        """Fetch a track"""
        encoded_id = decode_with_abort(track_id, ns)
        args = {"id": [encoded_id], "with_users": True}
        tracks = get_tracks(args)
        if not tracks:
            abort_not_found(encoded_id, ns)
        single_track = extend_track(tracks[0])
        return success_response(single_track)


@ns.route("/<string:track_id>/stream")
class TrackStream(Resource):
    @cache(ttl_sec=5)
    def get(self, track_id):
        """Redirect to track mp3"""
        encoded_id = decode_with_abort(track_id, ns)
        args = {"track_id": encoded_id}
        creator_nodes = get_track_user_creator_node(args)
        if creator_nodes is None:
            abort_not_found(encoded_id, ns)
        creator_nodes = creator_nodes.split(',')
        if not creator_nodes:
            abort_not_found(encoded_id, ns)

        primary_node = creator_nodes[0]
        stream_url = urljoin(primary_node, 'tracks/stream/{}'.format(encoded_id))
        return redirect(stream_url)


track_search_result = make_response(
    "track_search", ns, fields.List(fields.Nested(track)))


@ns.route("/search")
class TrackSearchResult(Resource):
    @ns.marshal_with(track_search_result)
    @ns.expect(search_parser)
    @cache(ttl_sec=60)
    def get(self):
        args = search_parser.parse_args()
        query = args["query"]
        search_args = {
            "query": query,
            "kind": SearchKind.tracks.name,
            "is_auto_complete": False,
            "current_user_id": None,
            "with_users": True
        }
        response = search(search_args)
        tracks = response["tracks"]
        tracks = list(map(extend_track, tracks))
        return success_response(tracks)


@ns.route("/trending")
class Trending(Resource):
    @ns.marshal_with(tracks_response)
    def get(self):
        """Get the trending tracks"""
        args = trending_parser.parse_args()
        time = args.get("time") if args.get("time") is not None else 'week'
        args = {
            'time': time,
            'genre': args.get("genre", None)
        }
        tracks = get_trending_tracks(args)
        tracks = list(map(extend_track, tracks))
        return success_response(tracks)
