import logging # pylint: disable=C0302
from flask_restx import Resource, Namespace, fields
from src.queries.get_tracks import get_tracks
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
