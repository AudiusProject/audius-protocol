from flask import Flask, Blueprint
from flask_restx import Resource, Api
from src.api.v1.users import ns as users_ns
from src.api.v1.playlists import ns as playlists_ns
from src.api.v1.tracks import ns as tracks_ns
from src.api.v1.metrics import ns as metrics_ns
from src.api.v1.models.users import ns as models_ns

bp = Blueprint('api_v1', __name__, url_prefix="/v1")
api_v1 = Api(bp, version='1.0', description='Audius V1 API')
api_v1.add_namespace(models_ns)
api_v1.add_namespace(users_ns)
api_v1.add_namespace(playlists_ns)
api_v1.add_namespace(tracks_ns)
api_v1.add_namespace(metrics_ns)
