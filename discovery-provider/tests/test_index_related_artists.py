import logging
from datetime import datetime, timedelta
from typing import List
import math

import redis
from sqlalchemy.sql.expression import desc
from src.models.related_artist import RelatedArtist
from src.tasks.index_related_artists import (
    process_related_artists_queue,
    queue_related_artist_calculation,
)
from src.utils.config import shared_config
from src.utils.db_session import get_db

from .utils import populate_mock_db

REDIS_URL = shared_config["redis"]["url"]

logger = logging.getLogger(__name__)


def test_index_related_artists(app):
    redis_conn = redis.Redis.from_url(url=REDIS_URL)
    with app.app_context():
        db = get_db()

    entities = {
        "users": [{}] * 7,
        "follows": [
            # at least 200 followers for user_0
            {"follower_user_id": i, "followee_user_id": 0}
            for i in range(1, 201)
        ]
        # 50 mutual followers between user_1 & user_0 make up 100% of user_1 followers = score 50
        + [{"follower_user_id": i, "followee_user_id": 1} for i in range(151, 201)]
        # 50 mutual followers between user_2 & user_0 make up 50% of user_2 followers = score 25
        + [{"follower_user_id": i, "followee_user_id": 2} for i in range(151, 251)]
        # 20 mutual followers between user_3 & user_0 make up 50% of user_3 followers = score 10
        + [{"follower_user_id": i, "followee_user_id": 3} for i in range(181, 221)]
        # 4 mutual followers between user_4 & user_0 make up 80% of user_4 followers = score 3.2
        + [{"follower_user_id": i, "followee_user_id": 4} for i in range(197, 202)]
        # 50 mutual followers between user_5 & user_0 make up 10% of user_5 followers = score 5
        + [{"follower_user_id": i, "followee_user_id": 5} for i in range(151, 651)]
        # 60 mutual followers between user_5 & user_0 make up 30% of user_6 followers = score 18
        + [{"follower_user_id": i, "followee_user_id": 6} for i in range(141, 341)],
        "tracks": [{"owner_id": i} for i in range(0, 7)],
    }
    populate_mock_db(db, entities)
    with db.scoped_session() as session:
        session.execute("REFRESH MATERIALIZED VIEW aggregate_user")
    queue_related_artist_calculation(redis_conn, 0)
    process_related_artists_queue(db, redis_conn)
    with db.scoped_session() as session:
        session.query(RelatedArtist).update(
            {RelatedArtist.created_at: datetime.utcnow() - timedelta(weeks=5)}
        )
        results: List[RelatedArtist] = (
            session.query(RelatedArtist)
            .filter(RelatedArtist.user_id == 0)
            .order_by(desc(RelatedArtist.score))
            .all()
        )
        assert results[0].related_artist_user_id == 1 and math.isclose(
            results[0].score, 50, abs_tol=0.001
        )
        assert results[1].related_artist_user_id == 2 and math.isclose(
            results[1].score, 25, abs_tol=0.001
        )
        assert results[2].related_artist_user_id == 6 and math.isclose(
            results[2].score, 18, abs_tol=0.001
        )
        assert results[3].related_artist_user_id == 3 and math.isclose(
            results[3].score, 10, abs_tol=0.001
        )
        assert results[4].related_artist_user_id == 5 and math.isclose(
            results[4].score, 5, abs_tol=0.001
        )
        assert results[5].related_artist_user_id == 4 and math.isclose(
            results[5].score, 3.2, abs_tol=0.001
        )
    populate_mock_db(
        db,
        {
            "follows": [
                {"follower_user_id": i, "followee_user_id": 0} for i in range(201, 251)
            ]
        },
        block_offset=100000,
    )

    queue_related_artist_calculation(redis_conn, 0)
    process_related_artists_queue(db, redis_conn)
    with db.scoped_session() as session:
        results: List[RelatedArtist] = (
            session.query(RelatedArtist)
            .filter(RelatedArtist.user_id == 0)
            .order_by(desc(RelatedArtist.score))
            .all()
        )
        assert results[0].related_artist_user_id == 2 and math.isclose(
            results[0].score, 100, abs_tol=0.001
        )
        assert results[1].related_artist_user_id == 6 and math.isclose(
            results[1].score, 60.5, abs_tol=0.001
        )
        assert results[2].related_artist_user_id == 1 and math.isclose(
            results[2].score, 50, abs_tol=0.001
        )
        assert results[3].related_artist_user_id == 3 and math.isclose(
            results[3].score, 40, abs_tol=0.001
        )
        assert results[4].related_artist_user_id == 5 and math.isclose(
            results[4].score, 20, abs_tol=0.001
        )
        assert results[5].related_artist_user_id == 4 and math.isclose(
            results[5].score, 5, abs_tol=0.001
        )
