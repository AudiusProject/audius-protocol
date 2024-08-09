from datetime import datetime

from dateutil.parser import parse

from src.trending_strategies.base_trending_strategy import BaseTrendingStrategy
from src.trending_strategies.trending_type_and_version import (
    TrendingType,
    TrendingVersion,
)

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
