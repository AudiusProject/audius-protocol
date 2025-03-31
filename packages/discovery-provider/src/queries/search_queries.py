import logging  # pylint: disable=C0302
from enum import Enum

from flask import Blueprint, request

from src import api_helpers, exceptions
from src.api.v1.helpers import parse_bool_param
from src.queries.query_helpers import get_current_user_id, get_pagination_vars
from src.queries.search_es import search_es_full, search_tags_es

logger = logging.getLogger(__name__)
bp = Blueprint("search_tags", __name__)


# ####### VARS ####### #


class SearchKind(Enum):
    all = 1
    tracks = 2
    users = 3
    playlists = 4
    albums = 5


# ####### ROUTES ####### #


# TODO: https://linear.app/audius/issue/PAY-3693/remove-legacy-searchtags-route
@bp.route("/search/tags", methods=("GET",))
def search_tags_legacy():
    validSearchKinds = [
        SearchKind.all,
        SearchKind.tracks,
        SearchKind.users,
        SearchKind.playlists,
        SearchKind.albums,
    ]
    search_str = request.args.get("query", type=str)
    kind = request.args.get("kind", type=str, default="all")

    if not search_str:
        raise exceptions.ArgumentError("Invalid value for parameter 'query'")

    try:
        searchKind = SearchKind[kind]
        if searchKind not in validSearchKinds:
            raise Exception
    except Exception:
        return api_helpers.error_response(
            f"Invalid value for parameter 'kind' must be in {[k.name for k in validSearchKinds]}",
            400,
        )

    current_user_id = get_current_user_id(required=False)
    include_purchaseable = (
        parse_bool_param(request.args.get("includePurchaseable", False)) or False
    )
    genres = request.args.get("genre")
    moods = request.args.get("mood")

    is_verified = parse_bool_param(request.args.get("is_verified", False)) or False
    has_downloads = parse_bool_param(request.args.get("has_downloads", False)) or False
    is_purchaseable = (
        parse_bool_param(request.args.get("is_purchaseable", False)) or False
    )

    keys = request.args.get("key")
    bpm_min = request.args.get("bpm_min")
    bpm_max = request.args.get("bpm_max")
    sort_method = request.args.get("sort_method")
    (limit, offset) = get_pagination_vars()

    search_args = {
        "kind": kind,
        "query": search_str,
        "current_user_id": current_user_id,
        "limit": limit,
        "offset": offset,
        "only_downloadable": False,
        "include_purchaseable": include_purchaseable,
        "only_purchaseable": is_purchaseable,
        "genres": genres,
        "moods": moods,
        "only_verified": is_verified,
        "only_with_downloads": has_downloads,
        "keys": keys,
        "bpm_min": bpm_min,
        "bpm_max": bpm_max,
        "sort_method": sort_method,
    }

    hits = search_tags_es(search_args)
    return api_helpers.success_response(hits)


def search_tags(args):
    """Perform a search by tags. `args` are the same as `search` with the exception
    that `is_auto_complete` is not supported"""
    return search_tags_es(args)


def search(args):
    """Perform a search. `args` should contain `is_auto_complete`,
    `query`, `kind`, `current_user_id`, and `only_downloadable`
    """

    return search_es_full(args)
