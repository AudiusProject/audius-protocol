import logging  # pylint: disable=C0302

from sqlalchemy import or_, and_

from src.models import Track
from src.utils import helpers
from src.utils.db_session import get_db_read_replica
from src.queries.query_helpers import get_current_user_id, populate_track_metadata, \
    paginate_query, get_users_by_id, get_users_ids

logger = logging.getLogger(__name__)


def get_tracks_including_unlisted(args):
    """Fetch a track, allowing unlisted.

    Args:
        args: dict
        args.identifiers: array of { handle, id, url_title} dicts
        args.current_user_id: optional current user ID
        args.filter_deleted: filter deleted tracks
        args.with_users: include users in unlisted tracks
    """
    tracks = []
    identifiers = args["identifiers"]
    for i in identifiers:
        helpers.validate_arguments(i, ["handle", "id", "url_title"])

    db = get_db_read_replica()
    with db.scoped_session() as session:
        base_query = session.query(Track)
        filter_cond = []

        # Create filter conditions as a list of `and` clauses
        for i in identifiers:
            filter_cond.append(and_(
                Track.is_current == True,
                Track.track_id == i["id"]
            ))

        # Pass array of `and` clauses into an `or` clause as destructured *args
        base_query = base_query.filter(or_(*filter_cond))

        # Allow filtering of deletes
        # Note: There is no standard for boolean url parameters, and any value (including 'false')
        # will be evaluated as true, so an explicit check is made for true
        if "filter_deleted" in args:
            filter_deleted = args.get("filter_deleted")
            if filter_deleted:
                base_query = base_query.filter(
                    Track.is_delete == False
                )

        # Perform the query
        # TODO: pagination is broken with unlisted tracks
        query_results = paginate_query(base_query).all()
        tracks = helpers.query_result_to_list(query_results)

        # Mapping of track_id -> track object from request;
        # used to check route_id when iterating through identifiers
        identifiers_map = {track["id"]: track for track in identifiers}

        # If the track is unlisted and the generated route_id does not match the route_id in db,
        # filter track out from response
        def filter_fn(track):
            input_track = identifiers_map[track["track_id"]]
            route_id = helpers.create_track_route_id(input_track["url_title"],
                                                     input_track["handle"])

            return not track["is_unlisted"] or track["route_id"] == route_id

        tracks = list(filter(filter_fn, tracks))

        if args.get("with_users", False):
            user_id_list = get_users_ids(tracks)
            users = get_users_by_id(session, user_id_list)
            for track in tracks:
                user = users[track['owner_id']]
                if user:
                    track['user'] = user

        track_ids = list(map(lambda track: track["track_id"], tracks))

        # Populate metadata
        current_user_id = args.get("current_user_id")
        tracks = populate_track_metadata(
            session, track_ids, tracks, current_user_id)

    return tracks
