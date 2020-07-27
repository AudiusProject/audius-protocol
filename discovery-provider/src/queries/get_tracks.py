import logging # pylint: disable=C0302

from src.models import Track
from src.utils import helpers
from src.utils.db_session import get_db_read_replica
from src.queries.query_helpers import get_current_user_id, paginate_query, parse_sort_param, \
  populate_track_metadata, get_users_ids, get_users_by_id

logger = logging.getLogger(__name__)

def get_tracks(args):
    tracks = []
    db = get_db_read_replica()
    with db.scoped_session() as session:
        # Create initial query
        base_query = session.query(Track)
        base_query = base_query.filter(Track.is_current == True, Track.is_unlisted == False, Track.stem_of == None)

        # Conditionally process an array of tracks
        if "id" in args:
            # Retrieve argument from flask request object
            # Ensures empty parameters are not processed
            track_id_str_list = args.get("id")
            track_id_list = []
            try:
                track_id_list = [int(y) for y in track_id_str_list]
                # Update query with track_id list
                base_query = base_query.filter(Track.track_id.in_(track_id_list))
            except ValueError as e:
                logger.error("Invalid value found in track id list", exc_info=True)
                raise e

        # Allow filtering of tracks by a certain creator
        if "user_id" in args:
            user_id = args.get("user_id")
            base_query = base_query.filter(
                Track.owner_id == user_id
            )

        # Allow filtering of deletes
        # Note: There is no standard for boolean url parameters, and any value (including 'false')
        # will be evaluated as true, so an explicit check is made for true
        if "filter_deleted" in args:
            filter_deleted = args.get("filter_deleted")
            if filter_deleted.lower() == 'true':
                base_query = base_query.filter(
                    Track.is_delete == False
                )

        if "min_block_number" in args:
            min_block_number = args.get("min_block_number", type=int)
            base_query = base_query.filter(
                Track.blocknumber >= min_block_number
            )

        whitelist_params = ['created_at', 'create_date', 'release_date', 'blocknumber', 'track_id']
        base_query = parse_sort_param(base_query, Track, whitelist_params)
        query_results = paginate_query(base_query).all()
        tracks = helpers.query_result_to_list(query_results)

        track_ids = list(map(lambda track: track["track_id"], tracks))

        current_user_id = get_current_user_id(required=False)

        # bundle peripheral info into track results
        tracks = populate_track_metadata(session, track_ids, tracks, current_user_id)

        if "with_users" in args and args.get("with_users") != 'false':
            user_id_list = get_users_ids(tracks)
            users = get_users_by_id(session, user_id_list)
            for track in tracks:
                user = users[track['owner_id']]
                if user:
                    track['user'] = user

    return tracks
