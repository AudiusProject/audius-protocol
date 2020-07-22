import logging # pylint: disable=C0302
from flask import Flask, Blueprint
from src.api.v1.models.playlists import playlist_model
from src.queries.get_playlists import get_playlists
from flask_restx import Resource, Namespace, fields
from src.queries.get_tracks import get_tracks
from src import api_helpers
from src.api.v1.helpers import decode_with_abort, extend_playlist, make_response

logger = logging.getLogger(__name__)

ns = Namespace('playlists', description='User related operations')

playlists_response = make_response("playlist_response", ns, fields.List(fields.Nested(playlist_model)))

@ns.route("/<string:playlist_id>")
class Playlist(Resource):
    @ns.marshal_with(playlists_response)
    def get(self, playlist_id):
        """Fetch a playlist"""
        playlist_id = decode_with_abort(playlist_id, ns)
        args = {"playlist_id": [playlist_id]}
        playlists = get_playlists(args)
        playlists = list(map(extend_playlist, playlists))
        response = api_helpers.success_response(playlists, 200, False)
        return response
