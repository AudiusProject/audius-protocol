from datetime import datetime, timedelta
from typing import List, Tuple, cast

from sqlalchemy.orm import Session, aliased
from sqlalchemy.sql.expression import column, desc, tablesample
from sqlalchemy.sql.functions import func
from sqlalchemy.sql.selectable import FromClause
from src.models import RelatedArtist
from src.models.models import AggregateUser, Follow, User
from src.queries.query_helpers import helpers, populate_user_metadata
from src.utils.db_session import get_db_read_replica
from src.utils.helpers import time_method

# Let calculations sit for this long before requiring recalculating
CALCULATION_TTL = timedelta(weeks=2)
# Only calculate for users with at least this many followers
MIN_FOLLOWER_REQUIREMENT = 200
# Only sample for users with at least this many followers
MAX_FOLLOWERS_WITHOUT_SAMPLE = 10000
# Set the sample size to 3 million, an extremely generous cap (roughly 50% at time of writing)
SAMPLE_SIZE_ROWS = 3000000
# Maximum number of related artists to have precalculated
MAX_RELATED_ARTIST_COUNT = 100


@time_method
def _calculate_related_artists_scores(
    session: Session, user_id, sample_size=None, limit=MAX_RELATED_ARTIST_COUNT
) -> List[RelatedArtist]:
    """Calculates the scores of related artists to the given user_id by
    querying who followers of the user_id also follow and using the scoring algorithm:

    `score = mutual_follower_count * percentage_of_suggested_artist_followers`
    """

    # Get all the followers of the artist
    followers_subquery = aliased(
        Follow,
        session.query(Follow.follower_user_id)
        .filter(
            Follow.followee_user_id == user_id,
            Follow.is_current,
            Follow.is_delete == False,
        )
        .subquery(name="followers"),
    )
    if sample_size is None:
        followers_sampled = aliased(Follow)
    else:
        followers_sampled = aliased(
            Follow, tablesample(cast(FromClause, Follow), func.system_rows(sample_size))
        )

    # Find out who the followers are following
    mutual_followers_subquery = (
        session.query(
            followers_sampled.followee_user_id.label("suggested_artist_id"),
            func.count(followers_subquery.follower_user_id).label(
                "mutual_follower_count"
            ),
        )
        .select_from(followers_subquery)
        .join(
            followers_sampled,
            followers_subquery.follower_user_id == followers_sampled.follower_user_id,
        )
        .filter(
            followers_sampled.is_current,
            followers_sampled.is_delete == False,
            followers_sampled.followee_user_id != user_id,
        )
        .group_by(followers_sampled.followee_user_id)
        .subquery(name="mutual_followers")
    )

    # Score the artists gathered from the above queries by:
    #
    #       score = mutual_follower_count * percentage_of_suggested_artist_followers
    #
    # Examples:
    #
    # If we're finding related artists to artist A and artist B shares 20 followers
    # with artist A, and 50% of artist B's following are followers of artist A, then
    # the score for artist B is 20 * 0.50 = 10.
    #
    # If artists A and C share 1000 followers but C has 100,000 followers total, then
    # that's only 1% of artist C's following. Artist C gets a score of 1,000 * 0.01 = 10
    #
    scoring_query = (
        session.query(
            User.user_id.label("related_artist_user_id"),
            func.round(
                1.0
                * column("mutual_follower_count")
                * column("mutual_follower_count")
                / AggregateUser.follower_count,
                3,
            ).label("score"),
        )
        .select_from(mutual_followers_subquery)
        .join(AggregateUser, AggregateUser.user_id == column("suggested_artist_id"))
        .join(User, User.user_id == column("suggested_artist_id"))
        .filter(User.is_current, AggregateUser.track_count > 0)
        .order_by(desc(column("score")), User.user_id)
        .limit(limit)
    )
    rows = scoring_query.all()
    related_artists = [
        RelatedArtist(
            user_id=user_id,
            related_artist_user_id=row.related_artist_user_id,
            score=row.score,
        )
        for row in rows
    ]
    return related_artists


@time_method
def update_related_artist_scores_if_needed(
    session: Session, user_id: int
) -> Tuple[bool, str]:
    """Checks to make sure the user specified has at least a minimum required number of followers,
    and that they don't already have fresh score calculation,
    and then if necessary calculates new related artist scores.

    Args:
        session (Session): the db sesssion to use for the connection
        user_id (int): the user_id of the user of which we're finding related artists

    Returns:
        bool: whether an update was needed
        str: the reason why an update was not needed, if applicable
    """

    # Filter by followers first, since that narrows down more users
    aggregate_user = (
        session.query(AggregateUser)
        .filter(AggregateUser.user_id == user_id)
        .one_or_none()
    )
    related_artists = []
    # Don't calculate if there's not enough followers
    if not aggregate_user or aggregate_user.follower_count < MIN_FOLLOWER_REQUIREMENT:
        return False, "Not enough followers"
    existing_score = (
        session.query(RelatedArtist).filter(RelatedArtist.user_id == user_id).first()
    )
    # Don't recalculate if we already have recently
    if (
        existing_score
        and existing_score.created_at > datetime.utcnow() - CALCULATION_TTL
    ):
        return (
            False,
            f"Fresh calculation already exists. created_at={existing_score.created_at}",
        )
    # Use table sampling if more than a certain number of followers
    if aggregate_user.follower_count >= MAX_FOLLOWERS_WITHOUT_SAMPLE:
        related_artists = _calculate_related_artists_scores(
            session, user_id, SAMPLE_SIZE_ROWS
        )
    else:
        related_artists = _calculate_related_artists_scores(session, user_id)
    if related_artists:
        session.query(RelatedArtist).filter(RelatedArtist.user_id == user_id).delete()
        session.bulk_save_objects(related_artists)
        return True, ""
    return False, "No results"


def _get_related_artists(session: Session, user_id: int, limit=100):
    related_artists = (
        session.query(User)
        .select_from(RelatedArtist)
        .join(User, User.user_id == RelatedArtist.related_artist_user_id)
        .filter(RelatedArtist.user_id == user_id, User.is_current)
        .order_by(desc(RelatedArtist.score))
        .limit(limit)
        .all()
    )
    return helpers.query_result_to_list(related_artists)


@time_method
def get_related_artists(user_id: int, current_user_id: int, limit: int = 100):
    db = get_db_read_replica()
    users = []
    with db.scoped_session() as session:
        aggregate_user = (
            session.query(AggregateUser)
            .filter(AggregateUser.user_id == user_id)
            .one_or_none()
        )
        if (
            aggregate_user
            and aggregate_user.track_count > 0
            and aggregate_user.follower_count >= MIN_FOLLOWER_REQUIREMENT
        ):
            users = _get_related_artists(session, user_id, limit)

        user_ids = list(map(lambda user: user["user_id"], users))
        users = populate_user_metadata(session, user_ids, users, current_user_id)
    return users
