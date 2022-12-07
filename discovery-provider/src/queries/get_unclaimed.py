from random import randrange

from src import exceptions
from src.models.playlists.aggregate_playlist import AggregatePlaylist
from src.models.tracks.aggregate_track import AggregateTrack
from src.models.users.aggregate_user import AggregateUser
from src.utils.db_session import get_db_read_replica

MAX_USER_ID = 999999999  # max for reward specifier id
MAX_POSTGRES_ID = 2147483647


def get_unclaimed(type):

    if type not in ["track", "playlist", "user"]:
        raise exceptions.ArgumentError(
            "Invalid type provided, must be one of 'track', 'playlist', 'user'"
        )

    db = get_db_read_replica()
    with db.scoped_session() as session:
        for _ in range(10):
            is_claimed = True
            random_id = randrange(MAX_POSTGRES_ID)
            if type == "user":
                random_id = randrange(MAX_USER_ID)
                is_claimed = (
                    session.query(AggregateUser.user_id).filter(
                        AggregateUser.user_id == random_id
                    )
                ).first()

            if type == "track":
                is_claimed = (
                    session.query(AggregateTrack.track_id).filter(
                        AggregateTrack.track_id == random_id
                    )
                ).first()

            if type == "playlist":
                is_claimed = (
                    session.query(AggregatePlaylist.playlist_id).filter(
                        AggregatePlaylist.playlist_id == random_id
                    )
                ).first()

            if not is_claimed:
                return random_id
