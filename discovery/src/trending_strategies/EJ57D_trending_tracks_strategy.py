import logging
import time
from datetime import datetime

from dateutil.parser import parse
from sqlalchemy.sql import text

from src.trending_strategies.base_trending_strategy import BaseTrendingStrategy
from src.trending_strategies.trending_type_and_version import (
    TrendingType,
    TrendingVersion,
)

logger = logging.getLogger(__name__)


# Trending Parameters
N = 1
a = max
M = pow
F = 50
O = 1
R = 0.25
i = 0.01
q = 100000.0
T = {"day": 1, "week": 7, "month": 30, "year": 365, "allTime": 100000}
y = 3


def z(time, track):
    # pylint: disable=W,C,R
    E = track["listens"]
    e = track["windowed_repost_count"]
    t = track["repost_count"]
    x = track["windowed_save_count"]
    A = track["save_count"]
    o = track["created_at"]
    l = track["owner_follower_count"]
    j = track["karma"]
    if l < y:
        return {"score": 0, **track}
    H = (N * E + F * e + O * x + R * t + i * A) * j
    L = T[time]
    K = datetime.now()
    w = parse(o)
    k = (K - w).days
    Q = 1
    if k > L:
        Q = a((1.0 / q), (M(q, (1 - k / L))))
    return {"score": H * Q, **track}


class TrendingTracksStrategyEJ57D(BaseTrendingStrategy):
    def __init__(self):
        super().__init__(TrendingType.TRACKS, TrendingVersion.EJ57D, True)

    def get_track_score(self, time_range, track):
        logger.error(
            f"get_track_score not implemented for Trending Tracks Strategy with version {TrendingVersion.EJ57D}"
        )

    def update_track_score_query(self, session):
        start_time = time.time()
        trending_track_query = text(
            """
            begin;
                DELETE FROM track_trending_scores WHERE type=:type AND version=:version;
                INSERT INTO track_trending_scores
                    (track_id, genre, type, version, time_range, score, created_at)
                    select
                        tp.track_id,
                        tp.genre,
                        :type,
                        :version,
                        :week_time_range,
                        CASE
                        WHEN tp.owner_follower_count < :y
                            THEN 0
                        WHEN EXTRACT(DAYS from now() - aip.created_at) > :week
                            THEN greatest(1.0/:q, pow(:q, greatest(-10, 1.0 - 1.0*EXTRACT(DAYS from now() - aip.created_at)/:week))) * (:N * aip.week_listen_counts + :F * tp.repost_week_count + :O * tp.save_week_count + :R * tp.repost_count + :i * tp.save_count) * tp.karma
                        ELSE (:N * aip.week_listen_counts + :F * tp.repost_week_count + :O * tp.save_week_count + :R * tp.repost_count + :i * tp.save_count) * tp.karma
                        END as week_score,
                        now()
                    from trending_params tp
                    inner join aggregate_interval_plays aip
                        on tp.track_id = aip.track_id;
                INSERT INTO track_trending_scores
                    (track_id, genre, type, version, time_range, score, created_at)
                    select
                        tp.track_id,
                        tp.genre,
                        :type,
                        :version,
                        :month_time_range,
                        CASE
                        WHEN tp.owner_follower_count < :y
                            THEN 0
                        WHEN EXTRACT(DAYS from now() - aip.created_at) > :month
                            THEN greatest(1.0/:q, pow(:q, greatest(-10, 1.0 - 1.0*EXTRACT(DAYS from now() - aip.created_at)/:month))) * (:N * aip.month_listen_counts + :F * tp.repost_month_count + :O * tp.save_month_count + :R * tp.repost_count + :i * tp.save_count) * tp.karma
                        ELSE (:N * aip.month_listen_counts + :F * tp.repost_month_count + :O * tp.save_month_count + :R * tp.repost_count + :i * tp.save_count) * tp.karma
                        END as month_score,
                        now()
                    from trending_params tp
                    inner join aggregate_interval_plays aip
                        on tp.track_id = aip.track_id;
                INSERT INTO track_trending_scores
                    (track_id, genre, type, version, time_range, score, created_at)
                    select
                        tp.track_id,
                        tp.genre,
                        :type,
                        :version,
                        :all_time_time_range,
                        CASE
                        WHEN tp.owner_follower_count < :y
                            THEN 0
                        ELSE (:N * ap.count + :R * tp.repost_count + :i * tp.save_count) * tp.karma
                        END as all_time_score,
                        now()
                    from trending_params tp
                    inner join aggregate_plays ap
                        on tp.track_id = ap.play_item_id
                    inner join tracks t
                        on ap.play_item_id = t.track_id
                    where -- same filtering for aggregate_interval_plays
                        t.is_current is True AND
                        t.is_delete is False AND
                        t.is_unlisted is False AND
                        t.stem_of is Null;
            commit;
        """
        )
        session.execute(
            trending_track_query,
            {
                "week": T["week"],
                "month": T["month"],
                "N": N,
                "F": F,
                "O": O,
                "R": R,
                "i": i,
                "q": q,
                "y": y,
                "type": self.trending_type.name,
                "version": self.version.name,
                "week_time_range": "week",
                "month_time_range": "month",
                "all_time_time_range": "allTime",
            },
        )
        duration = time.time() - start_time
        logger.info(
            f"trending_tracks_strategy | Finished calculating trending scores in {duration} seconds",
            extra={
                "id": "trending_strategy",
                "type": self.trending_type.name,
                "version": self.version.name,
                "duration": duration,
            },
        )

    def get_score_params(self):
        return {"xf": True, "pt": 0, "nm": 5}
