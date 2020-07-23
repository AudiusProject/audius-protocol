from urllib.parse import urljoin
import logging # pylint: disable=C0302
from flask import redirect
from flask_restx import Resource, Namespace, fields
from src.queries.get_tracks import get_tracks
from src.queries.get_track_user_creator_node import get_track_user_creator_node
from src.api.v1.helpers import abort_not_found, decode_with_abort, encode_int_id, extend_favorite, extend_track, extend_user, make_response, success_response
from .models.tracks import track

ns = Namespace('tracks', description='Track related operations')

track_response = make_response("track_response", ns, fields.Nested(track))
@ns.route('/<string:track_id>')
class Track(Resource):
    @ns.marshal_with(track_response)
    def get(self, track_id):
        """Fetch a track"""
        encoded_id = decode_with_abort(track_id, ns)
        args = {"id": encoded_id}
        tracks = get_tracks(args)
        if not tracks:
            abort_not_found(encoded_id, ns)
        single_track = extend_track(tracks[0])
        return success_response(single_track)

@ns.route("/<string:track_id>/stream")
class TrackStream(Resource):
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
        stream_url = urljoin(primary_node, 'stream/{}'.format(track_id))
        return redirect(stream_url)
