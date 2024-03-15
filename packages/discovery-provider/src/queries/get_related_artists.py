from sqlalchemy import text
from sqlalchemy.orm import Session

from src.models.users.user import User
from src.queries.query_helpers import helpers, populate_user_metadata
from src.utils.db_session import get_db_read_replica
from src.utils.helpers import time_method

_genre_based_sql = text(
    """
  with inp as (
    select
      genre,
      count(*) as track_count,
      rank() over (order by count(*) desc) as genre_rank
    from
      tracks t
    where
      t.is_current is true
      and t.is_delete is false
      and t.is_unlisted is false
      and t.is_available is true
      and t.stem_of is null
      and owner_id = :user_id
    group by
      genre
    order by count(*) desc limit 5
  )

  -- find similar aritst based on similar top genre + follower count
  select
    user_id,
    dominant_genre,
    follower_count,
    genre_rank
  from
    aggregate_user au
  join inp on dominant_genre = inp.genre and au.follower_count < (select follower_count * 3 from aggregate_user where user_id = :user_id)   
  order by genre_rank asc, follower_count desc

  limit :limit
  offset :offset
"""
)


def _genre_based_related_artists(session: Session, user_id: int, limit=100, offset=0):
    result = session.execute(
        _genre_based_sql, {"user_id": user_id, "limit": limit, "offset": offset}
    ).fetchall()
    user_ids = [r["user_id"] for r in result]
    users = session.query(User).filter(User.user_id.in_(user_ids)).all()
    return helpers.query_result_to_list(users)


@time_method
def get_related_artists(
    user_id: int, current_user_id: int, limit: int = 100, offset: int = 0
):
    db = get_db_read_replica()
    users = []
    with db.scoped_session() as session:
        users = _genre_based_related_artists(session, user_id, limit, offset)
        user_ids = list(map(lambda user: user["user_id"], users))
        users = populate_user_metadata(session, user_ids, users, current_user_id)
    return users
