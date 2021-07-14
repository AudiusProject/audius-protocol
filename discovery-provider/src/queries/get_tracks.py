import logging  # pylint: disable=C0302

from sqlalchemy import func, and_, or_
from sqlalchemy.sql.functions import coalesce
from src.models import AggregatePlays, Track, TrackRoute, User
from src.utils import helpers, redis_connection
from src.utils.db_session import get_db_read_replica
from src.queries.query_helpers import (
    add_query_pagination,
    get_pagination_vars,
    parse_sort_param,
    populate_track_metadata,
    get_users_ids,
    get_users_by_id,
)
from src.queries.get_unpopulated_tracks import get_unpopulated_tracks

logger = logging.getLogger(__name__)

redis = redis_connection.get_redis()


def _get_tracks(session, args):
    # Create initial query
    base_query = session.query(Track)
    base_query = base_query.filter(
        Track.is_current == True, Track.is_unlisted == False, Track.stem_of == None
    )

    # Conditionally process an array of tracks
    if "id" in args:
        track_id_list = args.get("id")
        try:
            # Update query with track_id list
            base_query = base_query.filter(Track.track_id.in_(track_id_list))
        except ValueError as e:
            logger.error("Invalid value found in track id list", exc_info=True)
            raise e

    # Allow filtering of tracks by a certain creator
    if "user_id" in args:
        user_id = args.get("user_id")
        base_query = base_query.filter(Track.owner_id == user_id)

    # Allow filtering of deletes
    if "filter_deleted" in args:
        filter_deleted = args.get("filter_deleted")
        if filter_deleted:
            base_query = base_query.filter(Track.is_delete == False)

    if "min_block_number" in args:
        min_block_number = args.get("min_block_number")
        base_query = base_query.filter(Track.blocknumber >= min_block_number)

    if "sort" in args:
        if args["sort"] == "date":
            base_query = base_query.order_by(
                coalesce(
                    # This func is defined in alembic migrations
                    func.to_date_safe(Track.release_date, "Dy Mon DD YYYY HH24:MI:SS"),
                    Track.created_at,
                ).desc(),
                Track.track_id.desc(),
            )
        elif args["sort"] == "plays":
            base_query = base_query.join(
                AggregatePlays, AggregatePlays.play_item_id == Track.track_id
            ).order_by(AggregatePlays.count.desc())
        else:
            whitelist_params = [
                "created_at",
                "create_date",
                "release_date",
                "blocknumber",
                "track_id",
            ]
            base_query = parse_sort_param(base_query, Track, whitelist_params)

    query_results = add_query_pagination(base_query, args["limit"], args["offset"])
    tracks = helpers.query_result_to_list(query_results.all())

    return tracks


def get_tracks(args):
    """
    Gets tracks.
    A note on caching strategy:
        - This method is cached at two layers: at the API via the @cache decorator,
        and within this method using the shared get_unpopulated_tracks cache.

        The shared cache only works when fetching via ID, so calls to fetch tracks
        via handle, asc/desc sort, or filtering by block_number won't hit the shared cache.
        These will hit the API cache unless they have a current_user_id included.

    """
    tracks = []

    db = get_db_read_replica()
    with db.scoped_session() as session:

        def get_tracks_and_ids():
            if "handle" in args:
                handle = args.get("handle")
                user_id = (
                    session.query(User.user_id)
                    .filter(User.handle_lc == handle.lower())
                    .first()
                )
                args["user_id"] = user_id

            can_use_shared_cache = (
                "id" in args
                and not "min_block_number" in args
                and not "sort" in args
                and not "user_id" in args
            )

            if can_use_shared_cache:
                should_filter_deleted = args.get("filter_deleted", False)
                tracks = get_unpopulated_tracks(
                    session, args["id"], should_filter_deleted
                )
                track_ids = list(map(lambda track: track["track_id"], tracks))
                return (tracks, track_ids)

            (limit, offset) = get_pagination_vars()
            args["limit"] = limit
            args["offset"] = offset

            tracks = _get_tracks(session, args)

            track_ids = list(map(lambda track: track["track_id"], tracks))

            return (tracks, track_ids)

        (tracks, track_ids) = get_tracks_and_ids()

        # bundle peripheral info into track results
        current_user_id = args.get("current_user_id")

        tracks = populate_track_metadata(session, track_ids, tracks, current_user_id)

        if args.get("with_users", False):
            user_id_list = get_users_ids(tracks)
            users = get_users_by_id(session, user_id_list, current_user_id)
            for track in tracks:
                user = users[track["owner_id"]]
                if user:
                    track["user"] = user

    return tracks


def get_track_id_by_slug(handle: str, slug: str):
    db = get_db_read_replica()
    with db.scoped_session() as session:
        route = (
            session.query(TrackRoute)
            .join(User, User.user_id == TrackRoute.owner_id)
            .filter(User.is_current, TrackRoute.is_current)
            .filter(TrackRoute.slug == slug)
            .filter(User.handle_lc == handle.lower())
        ).one()
        return route.track_id


def get_tracks_by_routes(routes: list):
    db = get_db_read_replica()

    filters = []
    for route in routes:
        filters.append(and_(
            TrackRoute.slug == route["slug"],
            User.handle_lc == route["handle"].lower()
        ))

    with db.scoped_session() as session:
        tracks_query = (
            session.query(Track, TrackRoute)
            .join(User, Track.owner_id == User.user_id)
            .join(TrackRoute,
                  and_(TrackRoute.track_id == Track.track_id,
                       TrackRoute.owner_id == Track.owner_id))
            .filter(User.is_current)
            .filter(or_(*filters))
        )
        print(str(tracks_query))
        tracks = tracks_query.all()
        print(tracks)
        return tracks
