from flask import Flask, Blueprint
from flask.helpers import url_for
from flask_restx import Resource, Api
from src.api.v1.users import ns as users_ns
from src.api.v1.playlists import ns as playlists_ns
from src.api.v1.tracks import ns as tracks_ns
from src.api.v1.metrics import ns as metrics_ns
from src.api.v1.models.users import ns as models_ns

class ApiWithHTTPS(Api):
    @property
    def specs_url(self):
        """
        Monkey patch for HTTPS or else swagger docs do not serve over HTTPS
        https://stackoverflow.com/questions/47508257/serving-flask-restplus-on-https-server
        """
        scheme = 'https' if 'https' in self.base_url else 'http'
        return url_for(self.endpoint('specs'), _external=True, _scheme=scheme)


bp = Blueprint('api_v1', __name__, url_prefix="/v1")
api_v1 = ApiWithHTTPS(bp, version='1.0', description='Audius V1 API')
api_v1.add_namespace(models_ns)
api_v1.add_namespace(users_ns)
api_v1.add_namespace(playlists_ns)
api_v1.add_namespace(tracks_ns)
api_v1.add_namespace(metrics_ns)
