from flask import Flask, Blueprint
from flask.helpers import url_for
from flask_restx import Resource, Api
from src.api.v1.users import ns as users_ns, full_ns as full_users_ns
from src.api.v1.playlists import ns as playlists_ns, full_ns as full_playlists_ns
from src.api.v1.tracks import ns as tracks_ns, full_ns as full_tracks_ns
from src.api.v1.challenges import ns as challenges_ns
from src.api.v1.metrics import ns as metrics_ns
from src.api.v1.search import full_ns as full_search_ns
from src.api.v1.models.users import ns as models_ns
from src.api.v1.resolve import ns as resolve_ns
from src.api.v1.challenge import ns as challenge_ns


class ApiWithHTTPS(Api):
    @property
    def specs_url(self):
        """
        Monkey patch for HTTPS or else swagger docs do not serve over HTTPS
        https://stackoverflow.com/questions/47508257/serving-flask-restplus-on-https-server
        """
        scheme = "https" if "https" in self.base_url else "http"
        return url_for(self.endpoint("specs"), _external=True, _scheme=scheme)


bp = Blueprint("api_v1", __name__, url_prefix="/v1")
api_v1 = ApiWithHTTPS(bp, version="1.0", description="Audius V1 API")
api_v1.add_namespace(models_ns)
api_v1.add_namespace(users_ns)
api_v1.add_namespace(playlists_ns)
api_v1.add_namespace(tracks_ns)
api_v1.add_namespace(challenges_ns)
api_v1.add_namespace(metrics_ns)
api_v1.add_namespace(resolve_ns)
api_v1.add_namespace(challenge_ns)

bp_full = Blueprint("api_v1_full", __name__, url_prefix="/v1/full")
api_v1_full = ApiWithHTTPS(bp_full, version="1.0")
api_v1_full.add_namespace(models_ns)
api_v1_full.add_namespace(full_tracks_ns)
api_v1_full.add_namespace(full_playlists_ns)
api_v1_full.add_namespace(full_users_ns)
api_v1_full.add_namespace(full_search_ns)
