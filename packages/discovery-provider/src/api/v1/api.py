from flask import Blueprint
from flask.helpers import url_for
from flask_restx import Api

from src.api.v1.challenges import full_ns as full_challenges_ns
from src.api.v1.challenges import ns as challenges_ns
from src.api.v1.cid_data import full_ns as cid_data_full_ns
from src.api.v1.dashboard_wallet_users import ns as dashboard_wallet_users_ns
from src.api.v1.developer_apps import ns as developer_apps_ns
from src.api.v1.metrics import ns as metrics_ns
from src.api.v1.models.users import ns as models_ns
from src.api.v1.notifications import full_ns as notifications_full_ns
from src.api.v1.playlists import full_ns as full_playlists_ns
from src.api.v1.playlists import ns as playlists_ns
from src.api.v1.reactions import ns as reactions_ns
from src.api.v1.resolve import ns as resolve_ns
from src.api.v1.search import full_ns as full_search_ns
from src.api.v1.tips import full_ns as full_tips_ns
from src.api.v1.tips import ns as tips_ns
from src.api.v1.tracks import full_ns as full_tracks_ns
from src.api.v1.tracks import ns as tracks_ns
from src.api.v1.transactions import full_ns as full_transactions_ns
from src.api.v1.users import full_ns as full_users_ns
from src.api.v1.users import ns as users_ns


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
api_v1.add_namespace(tips_ns)
api_v1.add_namespace(developer_apps_ns)
api_v1.add_namespace(dashboard_wallet_users_ns)
api_v1.add_namespace(metrics_ns)
api_v1.add_namespace(resolve_ns)


bp_full = Blueprint("api_v1_full", __name__, url_prefix="/v1/full")
api_v1_full = ApiWithHTTPS(bp_full, version="1.0")
api_v1_full.add_namespace(models_ns)
api_v1_full.add_namespace(full_tracks_ns)
api_v1_full.add_namespace(full_playlists_ns)
api_v1_full.add_namespace(full_users_ns)
api_v1_full.add_namespace(full_search_ns)
api_v1_full.add_namespace(full_tips_ns)
api_v1_full.add_namespace(reactions_ns)
api_v1_full.add_namespace(full_transactions_ns)
api_v1_full.add_namespace(cid_data_full_ns)
api_v1_full.add_namespace(notifications_full_ns)
api_v1_full.add_namespace(full_challenges_ns)
