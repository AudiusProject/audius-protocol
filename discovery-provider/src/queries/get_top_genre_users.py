import logging
from sqlalchemy import func, asc, desc

from src.models import User, Track, Follow
from src.utils.db_session import get_db_read_replica
from src.queries.query_helpers import populate_user_metadata, paginate_query
from src.queries.get_unpopulated_users import get_unpopulated_users

logger = logging.getLogger(__name__)


def get_top_genre_users(args):
    genres = []
    if "genre" in args:
        genres = args.get("genre")
        if isinstance(genres, str):
            genres = [genres]

    # If the with_users url arg is provided, then populate the user metadata else return user ids
    with_users = args.get("with_users", False)

    db = get_db_read_replica()
    with db.scoped_session() as session:
        with_genres = len(genres) != 0

        # Associate the user w/ a genre by counting the total # of tracks per genre
        # taking the genre w/ the most tracks (using genre name as secondary sort)
        user_genre_count_query = (
            session.query(
                User.user_id.label("user_id"),
                Track.genre.label("genre"),
                func.row_number()
                .over(
                    partition_by=User.user_id,
                    order_by=(desc(func.count(Track.genre)), asc(Track.genre)),
                )
                .label("row_number"),
            )
            .join(Track, Track.owner_id == User.user_id)
            .filter(
                User.is_current == True,
                User.is_creator == True,
                Track.is_unlisted == False,
                Track.stem_of == None,
                Track.is_current == True,
                Track.is_delete == False,
            )
            .group_by(User.user_id, Track.genre)
            .order_by(desc(func.count(Track.genre)), asc(Track.genre))
        )

        user_genre_count_query = user_genre_count_query.subquery(
            "user_genre_count_query"
        )

        user_genre_query = (
            session.query(
                user_genre_count_query.c.user_id.label("user_id"),
                user_genre_count_query.c.genre.label("genre"),
            )
            .filter(user_genre_count_query.c.row_number == 1)
            .subquery("user_genre_query")
        )

        # Using the subquery of user to associated genre,
        #   filter by the requested genres and
        #   sort by user follower count
        user_genre_followers_query = (
            session.query(user_genre_query.c.user_id.label("user_id"))
            .join(Follow, Follow.followee_user_id == user_genre_query.c.user_id)
            .filter(Follow.is_current == True, Follow.is_delete == False)
            .group_by(user_genre_query.c.user_id, user_genre_query.c.genre)
            .order_by(
                # desc('follower_count')
                desc(func.count(Follow.follower_user_id))
            )
        )

        if with_genres:
            user_genre_followers_query = user_genre_followers_query.filter(
                user_genre_query.c.genre.in_(genres)
            )

        # If the with_users flag is not set, respond with the user_ids
        users = paginate_query(user_genre_followers_query).all()
        user_ids = list(map(lambda user: user[0], users))

        # If the with_users flag is used, retrieve the user metadata
        if with_users:
            users = get_unpopulated_users(session, user_ids)
            queried_user_ids = list(map(lambda user: user["user_id"], users))
            users = populate_user_metadata(session, queried_user_ids, users, None)

            # Sort the users so that it's in the same order as the previous query
            user_map = {user["user_id"]: user for user in users}
            users = [user_map[user_id] for user_id in user_ids]
            return {"users": users}

        return {"user_ids": user_ids}
