from src import api_helpers
from src.queries.queries import to_dict
from src.queries.search_queries import search
from flask import Blueprint, request

bp = Blueprint("search_queries", __name__)

######## ROUTES ########


# Returns records that match a search term. usage is ```/search/full?query=<search term> ```
@bp.route("/search/full", methods=("GET",))
def search_full():
    args = to_dict(request.args)
    resp = search(False, args)
    return api_helpers.success_response(resp)


# Returns records that match a search term. usage is ```/search/autocomplete?query=<search term> ```
# lightweight search used for autocomplete - does not populate object metadata,
#   and appends user data for every track/playlist
@bp.route("/search/autocomplete", methods=("GET",))
def search_autocomplete():
    args = to_dict(request.args)
    resp = search(True, args)
    return api_helpers.success_response(resp)

# TODO!
@bp.route("/search/tags", methods=("GET",))
def search_tags_route():
    pass
