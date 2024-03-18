from flask import Blueprint, redirect, request
from flask.helpers import url_for
from flask_restx import Api


class ApiWithHTTPS(Api):
    @property
    def specs_url(self):
        """
        Monkey patch for HTTPS or else swagger docs do not serve over HTTPS
        https://stackoverflow.com/questions/47508257/serving-flask-restplus-on-https-server
        """
        scheme = "https" if "https" in self.base_url else "http"
        return url_for(self.endpoint("specs"), _external=True, _scheme=scheme)


bp = Blueprint("root", __name__, url_prefix="/")


@bp.route("", methods=["GET"])
def redirect_protocol_dashboard():
    base_url = request.base_url
    if base_url.endswith("/"):
        base_url = base_url[:-1]
    proto_dash = f"/dashboard/#/nodes/discovery-node?endpoint={base_url}"
    return redirect(proto_dash, code=302)
