from src.trending_strategies.base_trending_strategy import BaseTrendingStrategy
from src.trending_strategies.EJ57D_trending_tracks_strategy import z
from src.trending_strategies.trending_type_and_version import (
    TrendingType,
    TrendingVersion,
)


class TrendingPlaylistsStrategyBDNxn(BaseTrendingStrategy):
    def __init__(self):
        super().__init__(TrendingType.PLAYLISTS, TrendingVersion.BDNxn)

    def get_track_score(self, time_range, playlist):
        return z(time_range, playlist)

    def get_score_params(self):
        return {"zq": 1000, "xf": True, "pt": 0, "mt": 3}
