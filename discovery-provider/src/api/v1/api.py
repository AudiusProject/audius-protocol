from flask import Flask, Blueprint
from flask_restx import Resource, Api
from src.api.v1.tracks import ns as tracks_ns

bp = Blueprint('api_v1', __name__, url_prefix="/v1")
api_v1 = Api(bp, version='1.0', description='Audius V1 API')
api_v1.add_namespace(tracks_ns)
