import logging  # pylint: disable=C0302

from src.models.tracks.tag_track_user_matview import t_tag_track_user
from src.models.tracks.track import Track
from src.queries import response_name_constants
from src.queries.query_helpers import populate_track_metadata
from src.queries.sol_play_helpers import get_track_play_counts
from src.utils import helpers

logger = logging.getLogger(__name__)


def search_track_tags(session, args):
    """
    Gets the tracks with a given tag

    Args:
        session: sqlalchemy db session instance
        args: dict of arguments
        args.search_str: string the tag search string
        args.current_user_id: id | null The user id making the query
        args.limit: number the query limit of number of returns tracks
        args.offset: number the query offset for results

    Returns:
        list of tracks sorted by play count
    """

    track_ids = (
        session.query(t_tag_track_user.c.track_id)
        .filter(t_tag_track_user.c.tag == args["search_str"].lower())
        .all()
    )

    # track_ids is list of tuples - simplify to 1-D list
    track_ids = [i[0] for i in track_ids]

    tracks = (
        session.query(Track)
        .filter(
            Track.is_current == True,
            Track.is_delete == False,
            Track.is_unlisted == False,
            Track.stem_of == None,
            Track.track_id.in_(track_ids),
        )
        .all()
    )

    tracks = helpers.query_result_to_list(tracks)
    track_play_counts = get_track_play_counts(session, track_ids)

    tracks = populate_track_metadata(
        session, track_ids, tracks, args["current_user_id"]
    )

    for track in tracks:
        track_id = track["track_id"]
        track[response_name_constants.play_count] = track_play_counts.get(track_id, 0)

    play_count_sorted_tracks = sorted(
        tracks, key=lambda i: i[response_name_constants.play_count], reverse=True
    )

    # Add pagination parameters to track and user results
    play_count_sorted_tracks = play_count_sorted_tracks[
        slice(args["offset"], args["offset"] + args["limit"], 1)
    ]

    return play_count_sorted_tracks
