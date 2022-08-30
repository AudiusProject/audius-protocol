import logging  # pylint: disable=C0302
from enum import Enum

from flask import Blueprint, request
from src import api_helpers, exceptions
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


@bp.route("/search/tags", methods=("GET",))
def search_tags():
    search_str = request.args.get("query", type=str)
    current_user_id = get_current_user_id(required=False)
    if not search_str:
        raise exceptions.ArgumentError("Invalid value for parameter 'query'")

    user_tag_count = request.args.get("user_tag_count", type=str)
    if not user_tag_count:
        user_tag_count = "2"

    kind = request.args.get("kind", type=str, default="all")
    validSearchKinds = [SearchKind.all, SearchKind.tracks, SearchKind.users]
    try:
        searchKind = SearchKind[kind]
        if searchKind not in validSearchKinds:
            raise Exception
    except Exception:
        return api_helpers.error_response(
            f"Invalid value for parameter 'kind' must be in {[k.name for k in validSearchKinds]}",
            400,
        )

    (limit, offset) = get_pagination_vars()

    hits = search_tags_es(
        q=search_str,
        kind=kind,
        current_user_id=current_user_id,
        limit=limit,
        offset=offset,
        filter_premium=True,
    )
    return api_helpers.success_response(hits)


# SEARCH QUERIES
# We chose to use the raw SQL instead of SQLAlchemy because we're pushing SQLAlchemy to it's
# limit to do this query by creating new wrappers for pg functions that do not exist like
# TSQuery and pg_trgm specific functions like similarity.
#
# However, we query for object_id and fetch the actual objects using SQLAlchemy to preserve
# the full objects and helper methods that the ORM provides. This is done in post-processing
# after the initial text query executes.
#
# search query against custom materialized view created in alembic migration
# - returns all object ids which have a trigram match with query string
# - order by descending similarity and paginate
# - de-duplicates object_ids with multiple hits, returning highest match
#
# queries can be called for public data, or personalized data
# - personalized data will return only saved tracks, saved playlists, or followed users given current_user_id
#
# @devnote - track_ids argument should match tracks argument


def search(args):
    """Perform a search. `args` should contain `is_auto_complete`,
    `query`, `kind`, `current_user_id`, and `only_downloadable`
    """

    return search_es_full(args)
