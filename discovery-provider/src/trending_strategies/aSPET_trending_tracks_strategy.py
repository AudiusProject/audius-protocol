import logging
import time

from sqlalchemy.sql import text

from src.trending_strategies.base_trending_strategy import BaseTrendingStrategy
from src.trending_strategies.trending_type_and_version import (
    TrendingType,
    TrendingVersion,
)

from src.trending_strategies.ePWJD_trending_tracks_strategy import (
    N,
    F,
    O,
    R,
    i,
    q,
    T,
    y,
)

logger = logging.getLogger(__name__)


class TrendingTracksStrategyaSPET(BaseTrendingStrategy):
    def __init__(self):
        super().__init__(TrendingType.TRACKS, TrendingVersion.aSPET, True)

    def get_track_score(self, time_range, track):
        logger.error(f"get_track_score not implemented for Trending Tracks Strategy with version {TrendingVersion.aSPET}")
        return None

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
                        WHEN (now()::date - aip.created_at::date) > :week 
                            THEN greatest(1.0/:q, pow(:q, 1.0 - 1.0*(now()::date - aip.created_at::date)/:week)) * (:N * aip.week_listen_counts + :F * tp.repost_week_count + :O * tp.save_week_count + :R * tp.repost_count + :i * tp.save_count) * tp.karma
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
                        WHEN (now()::date - aip.created_at::date) > :month 
                            THEN greatest(1.0/:q, pow(:q, 1.0 - 1.0*(now()::date - aip.created_at::date)/:month)) * (:N * aip.month_listen_counts + :F * tp.repost_month_count + :O * tp.save_month_count + :R * tp.repost_count + :i * tp.save_count) * tp.karma
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
                        :year_time_range,
                        CASE 
                        WHEN tp.owner_follower_count < :y
                            THEN 0
                        WHEN (now()::date - aip.created_at::date) > :year 
                            THEN greatest(1.0/:q, pow(:q, 1.0 - 1.0*(now()::date - aip.created_at::date)/:year)) * (:N * aip.year_listen_counts + :F * tp.repost_year_count + :O * tp.save_year_count + :R * tp.repost_count + :i * tp.save_count) * tp.karma
                        ELSE (:N * aip.year_listen_counts + :F * tp.repost_year_count + :O * tp.save_year_count + :R * tp.repost_count + :i * tp.save_count) * tp.karma
                        END as year_score,
                        now()
                    from trending_params tp 
                    inner join aggregate_interval_plays aip 
                        on tp.track_id = aip.track_id;
            commit;
        """
        )
        session.execute(
            trending_track_query,
            {
                "week": T["week"],
                "month": T["month"],
                "year": T["year"],
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
                "year_time_range": "year",
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
