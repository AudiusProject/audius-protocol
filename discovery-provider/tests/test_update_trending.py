import logging
from datetime import datetime, timedelta

from src.tasks.generate_trending import generate_trending, get_listen_counts
from src.models import TrackTrendingScore, TrendingParam, AggregateIntervalPlay
from src.utils.db_session import get_db
from tests.utils import populate_mock_db
from src.trending_strategies.ePWJD_trending_tracks_strategy import (
    TrendingTracksStrategyePWJD,
)
from src.trending_strategies.aSPET_trending_tracks_strategy import (
    TrendingTracksStrategyaSPET,
)

logger = logging.getLogger(__name__)

# Setup trending from simplified metadata
def setup_trending(db):
    # Test data

    # test tracks
    # when creating tracks, track_id == index
    test_entities = {
        "users": [
            *[
                {
                    "user_id": i + 1,
                    "handle": str(i + 1),
                    "wallet": str(i + 1),
                    "profile_picture": "Qm0123456789abcdef0123456789abcdef0123456789ab",
                    "cover_photo": "Qm0123456789abcdef0123456789abcdef0123456789ab",
                    "bio": "filled in",
                }
                for i in range(20)
            ]
        ],
        "tracks": [
            {"track_id": 1, "owner_id": 1},
            {
                "track_id": 2,
                "owner_id": 1,
                "created_at": datetime.now() - timedelta(days=1),
            },
            {
                "track_id": 3,
                "owner_id": 2,
                "created_at": datetime.now() - timedelta(weeks=2),
            },
            {
                "track_id": 4,
                "owner_id": 2,
                "created_at": datetime.now() - timedelta(weeks=6),
            },
            {
                "track_id": 5,
                "owner_id": 2,
                "created_at": datetime.now() - timedelta(weeks=60),
            },
            {"track_id": 6, "owner_id": 2},
            {"track_id": 7, "owner_id": 3},
            {"track_id": 8, "owner_id": 3, "is_delete": True},
            {"track_id": 9, "owner_id": 3, "is_unlisted": True},
        ],
        "follows": [
            # at least 200 followers for user_0
            *[{"follower_user_id": 3 + i, "followee_user_id": 1} for i in range(10)],
            *[{"follower_user_id": 3 + i, "followee_user_id": 2} for i in range(15)],
            *[
                {"follower_user_id": 3 + i, "followee_user_id": 3} for i in range(2)
            ],  # Less than 3 followers, so 0 trending score
        ],
        "plays": [
            *[{"item_id": 1, "owner_id": 1} for i in range(10)],
            *[{"item_id": 2, "owner_id": 1} for i in range(12)],
            *[{"item_id": 3, "owner_id": 2} for i in range(13)],
            *[{"item_id": 4, "owner_id": 2} for i in range(14)],
            *[{"item_id": 5, "owner_id": 2} for i in range(15)],
            *[{"item_id": 6, "owner_id": 2} for i in range(16)],
            *[{"item_id": 7, "owner_id": 3} for i in range(17)],
            *[
                {"item_id": 1, "created_at": datetime.now() - timedelta(weeks=3)}
                for i in range(10)
            ],
            *[
                {"item_id": 1, "created_at": datetime.now() - timedelta(weeks=50)}
                for i in range(10)
            ],
            *[
                {"item_id": 1, "created_at": datetime.now() - timedelta(weeks=80)}
                for i in range(10)
            ],
            *[
                {"item_id": 2, "created_at": datetime.now() - timedelta(weeks=2)}
                for i in range(10)
            ],
            *[
                {"item_id": 3, "created_at": datetime.now() - timedelta(weeks=2)}
                for i in range(10)
            ],
            *[
                {"item_id": 4, "created_at": datetime.now() - timedelta(weeks=4)}
                for i in range(10)
            ],
            *[
                {"item_id": 5, "created_at": datetime.now() - timedelta(weeks=5)}
                for i in range(10)
            ],
            *[
                {"item_id": 6, "created_at": datetime.now() - timedelta(weeks=6)}
                for i in range(10)
            ],
        ],
        "reposts": [
            *[{"repost_item_id": 1, "user_id": i + 1} for i in range(13)],
            *[
                {
                    "repost_item_id": 1,
                    "user_id": i + 1,
                    "created_at": datetime.now() - timedelta(weeks=2),
                }
                for i in range(20)
            ],
            *[
                {
                    "repost_item_id": 1,
                    "user_id": i + 1,
                    "created_at": datetime.now() - timedelta(weeks=30),
                }
                for i in range(30)
            ],
            *[{"repost_item_id": 2, "user_id": i + 1} for i in range(24)],
            *[{"repost_item_id": 3, "user_id": i + 1} for i in range(25)],
            *[{"repost_item_id": 4, "user_id": i + 1} for i in range(26)],
            *[{"repost_item_id": 5, "user_id": i + 1} for i in range(27)],
            *[{"repost_item_id": 6, "user_id": i + 1} for i in range(28)],
            *[{"repost_item_id": 7, "user_id": i + 1} for i in range(29)],
            *[
                {
                    "repost_item_id": 2,
                    "user_id": i + 1,
                    "created_at": datetime.now() - timedelta(weeks=2),
                }
                for i in range(23)
            ],
            *[
                {
                    "repost_item_id": 3,
                    "user_id": i + 1,
                    "created_at": datetime.now() - timedelta(weeks=2),
                }
                for i in range(23)
            ],
            *[
                {
                    "repost_item_id": 4,
                    "user_id": i + 1,
                    "created_at": datetime.now() - timedelta(weeks=4),
                }
                for i in range(23)
            ],
            *[
                {
                    "repost_item_id": 5,
                    "user_id": i + 1,
                    "created_at": datetime.now() - timedelta(weeks=5),
                }
                for i in range(23)
            ],
            *[
                {
                    "repost_item_id": 6,
                    "user_id": i + 1,
                    "created_at": datetime.now() - timedelta(weeks=6),
                }
                for i in range(23)
            ],
        ],
        "saves": [
            *[{"save_item_id": 1, "user_id": i + 1} for i in range(4)],
            *[
                {
                    "save_item_id": 1,
                    "user_id": i + 1,
                    "created_at": datetime.now() - timedelta(weeks=3),
                }
                for i in range(8)
            ],
            *[
                {
                    "save_item_id": 1,
                    "user_id": i + 1,
                    "created_at": datetime.now() - timedelta(weeks=50),
                }
                for i in range(16)
            ],
            *[
                {
                    "save_item_id": 1,
                    "user_id": i + 1,
                    "created_at": datetime.now() - timedelta(weeks=60),
                }
                for i in range(1)
            ],
            *[{"save_item_id": 2, "user_id": i + 1} for i in range(44)],
            *[{"save_item_id": 3, "user_id": i + 1} for i in range(44)],
            *[{"save_item_id": 4, "user_id": i + 1} for i in range(44)],
            *[{"save_item_id": 5, "user_id": i + 1} for i in range(44)],
            *[{"save_item_id": 6, "user_id": i + 1} for i in range(44)],
            *[{"save_item_id": 7, "user_id": i + 1} for i in range(44)],
            *[
                {
                    "save_item_id": 2,
                    "user_id": i + 1,
                    "created_at": datetime.now() - timedelta(weeks=2),
                }
                for i in range(44)
            ],
            *[
                {
                    "save_item_id": 3,
                    "user_id": i + 1,
                    "created_at": datetime.now() - timedelta(weeks=2),
                }
                for i in range(44)
            ],
            *[
                {
                    "save_item_id": 4,
                    "user_id": i + 1,
                    "created_at": datetime.now() - timedelta(weeks=4),
                }
                for i in range(44)
            ],
            *[
                {
                    "save_item_id": 5,
                    "user_id": i + 1,
                    "created_at": datetime.now() - timedelta(weeks=5),
                }
                for i in range(44)
            ],
            *[
                {
                    "save_item_id": 6,
                    "user_id": i + 1,
                    "created_at": datetime.now() - timedelta(weeks=6),
                }
                for i in range(44)
            ],
        ],
    }

    populate_mock_db(db, test_entities)


# Tests
def test_update_interval_plays(app):
    """Test that refreshing aggregate_interval_plays gives the correct values"""
    with app.app_context():
        db = get_db()

    # setup
    setup_trending(db)

    with db.scoped_session() as session:
        session.execute(f"REFRESH MATERIALIZED VIEW aggregate_interval_plays")
        aggregate_interval_plays = session.query(AggregateIntervalPlay).all()

        def get_track_plays(track_id):
            for param in aggregate_interval_plays:
                if param.track_id == track_id:
                    return param
            return None

        assert len(aggregate_interval_plays) == 7

        track_plays = get_track_plays(1)
        assert track_plays.week_listen_counts == 10
        assert track_plays.month_listen_counts == 20
        assert track_plays.year_listen_counts == 30


def test_update_trending_params(app):
    """Test that refreshing trending params gives the correct values"""
    with app.app_context():
        db = get_db()

    # setup
    setup_trending(db)

    with db.scoped_session() as session:
        session.execute(f"REFRESH MATERIALIZED VIEW aggregate_user")
        session.execute(f"REFRESH MATERIALIZED VIEW aggregate_track")
        session.execute(f"REFRESH MATERIALIZED VIEW aggregate_plays")
        session.execute(f"REFRESH MATERIALIZED VIEW aggregate_interval_plays")
        session.execute(f"REFRESH MATERIALIZED VIEW trending_params")
        trending_params = session.query(TrendingParam).all()

        # Test that trending_params are not generated for hidden/deleted tracks
        # There should be 7 valid tracks with trending params
        assert len(trending_params) == 7

        def get_track_id(track_id):
            for param in trending_params:
                if param.track_id == track_id:
                    return param
            return None

        t1 = get_track_id(1)
        assert t1.play_count == 40
        assert t1.owner_follower_count == 10
        assert t1.repost_count == 63
        assert t1.repost_week_count == 13
        assert t1.repost_month_count == 33
        assert t1.repost_year_count == 63
        assert t1.save_count == 29
        assert t1.save_week_count == 4
        assert t1.save_month_count == 12
        assert t1.save_year_count == 28
        # user 1 has 10 followers
        # user 2 has 15 followers
        # user 3 has 2 followers
        # 3 saves from all 3 users
        # 4 reposts from user 1
        # 3 reposts from users 2, 3
        # -> (3 * 10 + 3 * 15 + 3 * 2) + (4 * 10 + 3 * 15 + 3 * 2) = 172
        assert float(t1.karma) == 172


def test_update_track_score_query(app):
    """Happy path test: test that we get all valid listens from prior year"""
    with app.app_context():
        db = get_db()

    # setup
    setup_trending(db)
    prev_strategy = TrendingTracksStrategyePWJD()
    udpated_strategy = TrendingTracksStrategyaSPET()

    with db.scoped_session() as session:
        session.execute(f"REFRESH MATERIALIZED VIEW aggregate_user")
        session.execute(f"REFRESH MATERIALIZED VIEW aggregate_track")
        session.execute(f"REFRESH MATERIALIZED VIEW aggregate_plays")
        session.execute(f"REFRESH MATERIALIZED VIEW aggregate_interval_plays")
        session.execute(f"REFRESH MATERIALIZED VIEW trending_params")
        udpated_strategy.update_track_score_query(session)
        scores = session.query(TrackTrendingScore).all()
        # Test that scores are not generated for hidden/deleted tracks
        # There should be 7 valid tracks * 3 valid time ranges (week/month/year)
        assert len(scores) == 21

        def get_time_sorted(time_range):
            return sorted(
                [score for score in scores if score.time_range == time_range],
                key=lambda k: (k.score, k.track_id),
                reverse=True,
            )

        week_scores = get_time_sorted("week")
        month_scores = get_time_sorted("month")
        year_scores = get_time_sorted("year")

        assert len(week_scores) == 7
        assert len(month_scores) == 7
        assert len(year_scores) == 7

        # Check that the type and version fields are correct
        for score in scores:
            assert score.type == udpated_strategy.trending_type.name
            assert score.version == udpated_strategy.version.name

        # Check that the type and version fields are correct
        for score in scores:
            assert score.type == udpated_strategy.trending_type.name
            assert score.version == udpated_strategy.version.name

        def get_track_score(track_id, time_range):
            for score in scores:
                if score.track_id == track_id and score.time_range == time_range:
                    return score
            return None

        def get_old_trending(time_range):
            genre = None
            old_trending_params = generate_trending(
                session, time_range, genre, 10, 0, prev_strategy
            )
            track_scores = [
                prev_strategy.get_track_score(time_range, track)
                for track in old_trending_params["listen_counts"]
            ]
            # Re apply the limit just in case we did decide to include more tracks in the scoring than the limit
            sorted_track_scores = sorted(
                track_scores, key=lambda k: (k["score"], k["track_id"]), reverse=True
            )
            return sorted_track_scores

        previous_week_trending = get_old_trending("week")
        for idx, updated_score in enumerate(week_scores):
            assert previous_week_trending[idx]["track_id"] == updated_score.track_id
            assert round(previous_week_trending[idx]["score"], 2) == round(
                updated_score.score, 2
            )

        previous_month_trending = get_old_trending("month")
        for idx, updated_score in enumerate(month_scores):
            assert previous_month_trending[idx]["track_id"] == updated_score.track_id
            assert round(previous_month_trending[idx]["score"], 2) == round(
                updated_score.score, 2
            )

        previous_year_trending = get_old_trending("year")
        for idx, updated_score in enumerate(year_scores):
            assert previous_year_trending[idx]["track_id"] == updated_score.track_id
            assert round(previous_year_trending[idx]["score"], 2) == round(
                updated_score.score, 2
            )
