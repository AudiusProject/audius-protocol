from flask import Flask, Blueprint
from flask_restx import Resource, Api
from src.api.v1.users import ns as users_ns

bp = Blueprint('api_v1', __name__, url_prefix="/v1")
api_v1 = Api(bp, version='1.0', description='Audius V1 API')
api_v1.add_namespace(users_ns)
