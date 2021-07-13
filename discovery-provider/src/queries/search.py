from flask import Blueprint, request
from src import api_helpers
from src.queries.queries import to_dict
from src.queries.query_helpers import get_current_user_id, get_pagination_vars
from src.queries.search_queries import SearchKind, search

from src.utils.redis_metrics import record_metrics

bp = Blueprint("search_queries", __name__)


def validate_search_args(args):
    searchStr = args.get("query")
    if not searchStr:
        return api_helpers.error_response("Invalid value for parameter 'query'", 400)

    kind = args.get("kind", "all")
    if kind not in SearchKind.__members__:
        return api_helpers.error_response(
            "Invalid value for parameter 'kind' must be in %s"
            % [k.name for k in SearchKind],
            400,
        )
    return None


# Returns records that match a search term. usage is ```/search/full?query=<search term> ```
@bp.route("/search/full", methods=("GET",))
@record_metrics
def search_full():
    args = to_dict(request.args)
    validation_error = validate_search_args(args)
    if validation_error:
        return validation_error

    current_user_id = get_current_user_id(required=False)
    limit, offset = get_pagination_vars()
    search_args = {
        "is_auto_complete": False,
        "kind": args.get("kind", "all"),
        "query": args.get("query"),
        "current_user_id": current_user_id,
        "with_users": False,
        "limit": limit,
        "offset": offset,
        "only_downloadable": False,
    }
    resp = search(search_args)
    return api_helpers.success_response(resp)


# Returns records that match a search term. usage is ```/search/autocomplete?query=<search term> ```
# lightweight search used for autocomplete - does not populate object metadata,
#   and appends user data for every track/playlist
@bp.route("/search/autocomplete", methods=("GET",))
@record_metrics
def search_autocomplete():
    args = to_dict(request.args)
    validation_error = validate_search_args(args)
    if validation_error:
        return validation_error

    current_user_id = get_current_user_id(required=False)
    limit, offset = get_pagination_vars()
    search_args = {
        "is_auto_complete": True,
        "kind": args.get("kind", "all"),
        "query": args.get("query"),
        "current_user_id": current_user_id,
        "with_users": False,
        "limit": limit,
        "offset": offset,
        "only_downloadable": False,
    }
    resp = search(search_args)
    return api_helpers.success_response(resp)
