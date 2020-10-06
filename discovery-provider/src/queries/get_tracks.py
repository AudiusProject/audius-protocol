import logging # pylint: disable=C0302

from src.models import AggregatePlays, Track, User
from src.utils import helpers
from src.utils.db_session import get_db_read_replica
from src.queries.query_helpers import paginate_query, parse_sort_param, \
  populate_track_metadata, get_users_ids, get_users_by_id

logger = logging.getLogger(__name__)

def get_tracks(args):
    tracks = []
    current_user_id = args.get("current_user_id")

    db = get_db_read_replica()
    with db.scoped_session() as session:
        if "handle" in args:
            handle = args.get("handle")
            user_id = session.query(User.user_id).filter(User.handle_lc == handle.lower()).first()
            args["user_id"] = user_id

        # Create initial query
        base_query = session.query(Track)
        base_query = base_query.filter(Track.is_current == True, Track.is_unlisted == False, Track.stem_of == None)

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
            base_query = base_query.filter(
                Track.owner_id == user_id
            )

        # Allow filtering of deletes
        if "filter_deleted" in args:
            filter_deleted = args.get("filter_deleted")
            if filter_deleted:
                base_query = base_query.filter(
                    Track.is_delete == False
                )

        if "min_block_number" in args:
            min_block_number = args.get("min_block_number")
            base_query = base_query.filter(
                Track.blocknumber >= min_block_number
            )

        if "sort" in args:
            if args["sort"] == "date":
                base_query = base_query.order_by(Track.created_at.desc(), Track.track_id.desc())
            elif args["sort"] == "plays":
                base_query = base_query.join(
                    AggregatePlays,
                    AggregatePlays.play_item_id == Track.track_id
                ).order_by(
                    AggregatePlays.count.desc()
                )
        else:
            whitelist_params = ['created_at', 'create_date', 'release_date', 'blocknumber', 'track_id']
            base_query = parse_sort_param(base_query, Track, whitelist_params)
        query_results = paginate_query(base_query).all()
        tracks = helpers.query_result_to_list(query_results)

        track_ids = list(map(lambda track: track["track_id"], tracks))

        # bundle peripheral info into track results
        tracks = populate_track_metadata(session, track_ids, tracks, current_user_id)

        if args.get("with_users", False):
            user_id_list = get_users_ids(tracks)
            users = get_users_by_id(session, user_id_list, current_user_id)
            for track in tracks:
                user = users[track['owner_id']]
                if user:
                    track['user'] = user

    return tracks
