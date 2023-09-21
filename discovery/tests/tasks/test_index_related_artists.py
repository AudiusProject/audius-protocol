import logging
import math
from typing import List

from sqlalchemy.sql.expression import desc

from src.models.users.related_artist import RelatedArtist
from src.queries.get_related_artists_minhash import update_related_artist_minhash
from src.utils.config import shared_config
from src.utils.db_session import get_db
from tests.utils import populate_mock_db

REDIS_URL = shared_config["redis"]["url"]

logger = logging.getLogger(__name__)


def test_index_related_artists(app):
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
        # 60 mutual followers between user_6 & user_0 make up 30% of user_6 followers = score 18
        + [{"follower_user_id": i, "followee_user_id": 6} for i in range(141, 341)],
        "tracks": [{"owner_id": i} for i in range(0, 7)],
    }
    populate_mock_db(db, entities)

    with db.scoped_session() as session:
        update_related_artist_minhash(session)

        results: List[RelatedArtist] = list(
            session.query(RelatedArtist)
            .filter(RelatedArtist.user_id == 0)
            .order_by(desc(RelatedArtist.score))
            .all()
        )

        expectations = [
            (1, 49),
            (2, 25),
            (6, 18),
            (3, 9),
            (5, 1),
        ]

        compare_results_to_expectations(results, expectations)

    populate_mock_db(
        db,
        {
            "follows": [
                {"follower_user_id": i, "followee_user_id": 0} for i in range(201, 251)
            ]
        },
        block_offset=100000,
    )

    with db.scoped_session() as session:
        update_related_artist_minhash(session)

        results: List[RelatedArtist] = (
            session.query(RelatedArtist)
            .filter(RelatedArtist.user_id == 0)
            .order_by(desc(RelatedArtist.score))
            .all()
        )

        expectations = [
            (2, 100),
            (6, 60),
            (1, 49),
            (3, 39),
            (5, 11),
        ]

        compare_results_to_expectations(results, expectations)


def compare_results_to_expectations(results, expectations):
    got = [(row.related_artist_user_id, math.floor(row.score)) for row in results]
    assert got == expectations
