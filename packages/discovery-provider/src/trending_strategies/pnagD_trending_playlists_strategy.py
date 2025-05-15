import logging
import time
from datetime import datetime

from dateutil.parser import parse
from sqlalchemy import text

from src.trending_strategies.base_trending_strategy import BaseTrendingStrategy
from src.trending_strategies.trending_type_and_version import (
    TrendingType,
    TrendingVersion,
)

logger = logging.getLogger(__name__)

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


class TrendingPlaylistsStrategypnagD(BaseTrendingStrategy):
    def __init__(self):
        super().__init__(TrendingType.PLAYLISTS, TrendingVersion.pnagD)

    def get_track_score(self, time_range, playlist):
        # pylint: disable=W,C,R
        E = playlist["listens"]
        e = playlist["windowed_repost_count"]
        t = playlist["repost_count"]
        x = playlist["windowed_save_count"]
        A = playlist["save_count"]
        o = playlist["created_at"]
        v = playlist["release_date"]
        l = playlist["owner_follower_count"]
        j = playlist["karma"]
        if l < y:
            return {"score": 0, **playlist}
        H = (N * E + F * e + O * x + R * t + i * A) * j
        L = T[time_range]
        K = datetime.now()
        w = parse(o)
        wv = parse(v)
        if wv > K:
            wv = w
        k = (K - max(w, wv)).days
        Q = 1
        if k > L:
            Q = a((1.0 / q), (M(q, (1 - k / L))))
        return {"score": H * Q, **playlist}

    def get_score_params(self):
        return {"zq": 1000, "xf": True, "pt": 0, "mt": 3}

    def update_playlist_score_query(self, session):
        start_time = time.time()
        trending_playlist_query = text(
            """
            begin;
                DELETE FROM playlist_trending_scores WHERE type=:type AND version=:version;
                INSERT INTO playlist_trending_scores
                    (playlist_id, type, version, time_range, score, created_at)
                    with saves_and_reposts as (
                        select user_id, repost_item_id as item_id
                        from reposts
                        where
                            is_current is True AND
                            is_delete is False AND
                            repost_type = 'playlist' AND
                            repost_item_id in (select playlist_id from playlists where is_current is True AND is_delete is False AND is_private is False) AND
                            created_at >= NOW() - interval ':week days'
                        union all
                        select user_id, save_item_id as item_id
                        from saves
                        where
                            is_current is True AND
                            is_delete is False AND
                            save_type = 'playlist' AND
                            save_item_id in (select playlist_id from playlists where is_current is True AND is_delete is False AND is_private is False) AND
                            created_at >= NOW() - interval ':week days'
                    ),
                    filtered_users as (
                        select sr.user_id, sr.item_id
                        from saves_and_reposts sr
                        join users u on sr.user_id = u.user_id
                        where
                            (u.cover_photo is not null or u.cover_photo_sizes is not null) and
                            (u.profile_picture is not null or u.profile_picture_sizes is not null) and
                            u.bio is not null and
                            u.is_current is true
                    ),
                    karma_scores as (
                        select
                            item_id,
                            cast(sum(au.follower_count) as integer) as karma
                        from filtered_users f
                        join aggregate_user au on f.user_id = au.user_id
                        group by item_id
                    )
                    select
                        p.playlist_id,
                        :type,
                        :version,
                        :week_time_range,
                        CASE
                        WHEN au.follower_count < :y
                            THEN 0
                        WHEN EXTRACT(DAYS FROM now() - (
                            CASE
                                WHEN p.release_date > now() THEN p.created_at
                                ELSE GREATEST(p.release_date, p.created_at)
                            END
                        )) > :week
                            THEN GREATEST(
                                1.0 / :q,
                                POW(
                                    :q,
                                    GREATEST(
                                        -10,
                                        1.0 - 1.0 * EXTRACT(DAYS FROM now() - (
                                            CASE
                                                WHEN p.release_date > now() THEN p.created_at
                                                ELSE GREATEST(p.release_date, p.created_at)
                                            END
                                        )) / :week
                                    )
                                )
                            ) * (
                                :N * 1 + -- listens is always 1 for playlists
                                :F * COALESCE(rp.week_count, 0) +
                                :O * COALESCE(s.week_count, 0) +
                                :R * COALESCE(ap.repost_count, 0) +
                                :i * COALESCE(ap.save_count, 0)
                            ) * COALESCE(k.karma, 1)
                        ELSE (
                            :N * 1 + -- listens is always 1 for playlists
                            :F * COALESCE(rp.week_count, 0) +
                            :O * COALESCE(s.week_count, 0) +
                            :R * COALESCE(ap.repost_count, 0) +
                            :i * COALESCE(ap.save_count, 0)
                        ) * COALESCE(k.karma, 1)
                        END as score,
                        now()
                    from playlists p
                    inner join aggregate_user au
                        on p.playlist_owner_id = au.user_id
                    left join aggregate_playlist ap
                        on p.playlist_id = ap.playlist_id
                    left join (
                        select
                            save_item_id,
                            count(*) as week_count
                        from saves
                        where
                            is_current is True AND
                            is_delete is False AND
                            save_type = 'playlist' AND
                            created_at > now() - interval ':week days'
                        group by save_item_id
                    ) s on p.playlist_id = s.save_item_id
                    left join (
                        select
                            repost_item_id,
                            count(*) as week_count
                        from reposts
                        where
                            is_current is True AND
                            is_delete is False AND
                            repost_type = 'playlist' AND
                            created_at > now() - interval ':week days'
                        group by repost_item_id
                    ) rp on p.playlist_id = rp.repost_item_id
                    left join karma_scores k
                        on p.playlist_id = k.item_id
                    where
                        p.is_current is True AND
                        p.is_delete is False AND
                        p.is_private is False AND
                        jsonb_array_length(p.playlist_contents->'track_ids') >= :mt;
                INSERT INTO playlist_trending_scores
                    (playlist_id, type, version, time_range, score, created_at)
                    with saves_and_reposts as (
                        select user_id, repost_item_id as item_id
                        from reposts
                        where
                            is_current is True AND
                            is_delete is False AND
                            repost_type = 'playlist' AND
                            repost_item_id in (select playlist_id from playlists where is_current is True AND is_delete is False AND is_private is False) AND
                            created_at >= NOW() - interval ':month days'
                        union all
                        select user_id, save_item_id as item_id
                        from saves
                        where
                            is_current is True AND
                            is_delete is False AND
                            save_type = 'playlist' AND
                            save_item_id in (select playlist_id from playlists where is_current is True AND is_delete is False AND is_private is False) AND
                            created_at >= NOW() - interval ':month days'
                    ),
                    filtered_users as (
                        select sr.user_id, sr.item_id
                        from saves_and_reposts sr
                        join users u on sr.user_id = u.user_id
                        where
                            (u.cover_photo is not null or u.cover_photo_sizes is not null) and
                            (u.profile_picture is not null or u.profile_picture_sizes is not null) and
                            u.bio is not null and
                            u.is_current is true
                    ),
                    karma_scores as (
                        select
                            item_id,
                            cast(sum(au.follower_count) as integer) as karma
                        from filtered_users f
                        join aggregate_user au on f.user_id = au.user_id
                        group by item_id
                    )
                    select
                        p.playlist_id,
                        :type,
                        :version,
                        :month_time_range,
                        CASE
                        WHEN au.follower_count < :y
                            THEN 0
                        WHEN EXTRACT(DAYS FROM now() - (
                            CASE
                                WHEN p.release_date > now() THEN p.created_at
                                ELSE GREATEST(p.release_date, p.created_at)
                            END
                        )) > :month
                            THEN GREATEST(
                                1.0 / :q,
                                POW(
                                    :q,
                                    GREATEST(
                                        -10,
                                        1.0 - 1.0 * EXTRACT(DAYS FROM now() - (
                                            CASE
                                                WHEN p.release_date > now() THEN p.created_at
                                                ELSE GREATEST(p.release_date, p.created_at)
                                            END
                                        )) / :month
                                    )
                                )
                            ) * (
                                :N * 1 + -- listens is always 1 for playlists
                                :F * COALESCE(rp.month_count, 0) +
                                :O * COALESCE(s.month_count, 0) +
                                :R * COALESCE(ap.repost_count, 0) +
                                :i * COALESCE(ap.save_count, 0)
                            ) * COALESCE(k.karma, 1)
                        ELSE (
                            :N * 1 + -- listens is always 1 for playlists
                            :F * COALESCE(rp.month_count, 0) +
                            :O * COALESCE(s.month_count, 0) +
                            :R * COALESCE(ap.repost_count, 0) +
                            :i * COALESCE(ap.save_count, 0)
                        ) * COALESCE(k.karma, 1)
                        END as score,
                        now()
                    from playlists p
                    inner join aggregate_user au
                        on p.playlist_owner_id = au.user_id
                    left join aggregate_playlist ap
                        on p.playlist_id = ap.playlist_id
                    left join (
                        select
                            save_item_id,
                            count(*) as month_count
                        from saves
                        where
                            is_current is True AND
                            is_delete is False AND
                            save_type = 'playlist' AND
                            created_at > now() - interval ':month days'
                        group by save_item_id
                    ) s on p.playlist_id = s.save_item_id
                    left join (
                        select
                            repost_item_id,
                            count(*) as month_count
                        from reposts
                        where
                            is_current is True AND
                            is_delete is False AND
                            repost_type = 'playlist' AND
                            created_at > now() - interval ':month days'
                        group by repost_item_id
                    ) rp on p.playlist_id = rp.repost_item_id
                    left join karma_scores k
                        on p.playlist_id = k.item_id
                    where
                        p.is_current is True AND
                        p.is_delete is False AND
                        p.is_private is False AND
                        jsonb_array_length(p.playlist_contents->'track_ids') >= :mt;
                INSERT INTO playlist_trending_scores
                    (playlist_id, type, version, time_range, score, created_at)
                    with saves_and_reposts as (
                        select user_id, repost_item_id as item_id
                        from reposts
                        where
                            is_current is True AND
                            is_delete is False AND
                            repost_type = 'playlist' AND
                            repost_item_id in (select playlist_id from playlists where is_current is True AND is_delete is False AND is_private is False)
                        union all
                        select user_id, save_item_id as item_id
                        from saves
                        where
                            is_current is True AND
                            is_delete is False AND
                            save_type = 'playlist' AND
                            save_item_id in (select playlist_id from playlists where is_current is True AND is_delete is False AND is_private is False)
                    ),
                    filtered_users as (
                        select sr.user_id, sr.item_id
                        from saves_and_reposts sr
                        join users u on sr.user_id = u.user_id
                        where
                            (u.cover_photo is not null or u.cover_photo_sizes is not null) and
                            (u.profile_picture is not null or u.profile_picture_sizes is not null) and
                            u.bio is not null and
                            u.is_current is true
                    ),
                    karma_scores as (
                        select
                            item_id,
                            cast(sum(au.follower_count) as integer) as karma
                        from filtered_users f
                        join aggregate_user au on f.user_id = au.user_id
                        group by item_id
                    )
                    select
                        p.playlist_id,
                        :type,
                        :version,
                        :all_time_time_range,
                        CASE
                        WHEN au.follower_count < :y
                            THEN 0
                        ELSE (
                            :N * 1 + -- listens is always 1 for playlists
                            :R * COALESCE(ap.repost_count, 0) +
                            :i * COALESCE(ap.save_count, 0)
                        ) * COALESCE(k.karma, 1)
                        END as score,
                        now()
                    from playlists p
                    inner join aggregate_user au
                        on p.playlist_owner_id = au.user_id
                    left join aggregate_playlist ap
                        on p.playlist_id = ap.playlist_id
                    left join karma_scores k
                        on p.playlist_id = k.item_id
                    where
                        p.is_current is True AND
                        p.is_delete is False AND
                        p.is_private is False AND
                        jsonb_array_length(p.playlist_contents->'track_ids') >= :mt;
            commit;
        """
        )
        session.execute(
            trending_playlist_query,
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
                "mt": self.get_score_params()["mt"],
            },
        )
        duration = time.time() - start_time
        logger.info(
            f"trending_playlists_strategy | Finished calculating trending scores in {duration} seconds",
            extra={
                "id": "trending_strategy",
                "type": self.trending_type.name,
                "version": self.version.name,
                "duration": duration,
            },
        )
