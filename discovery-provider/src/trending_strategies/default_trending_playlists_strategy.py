from src.trending_strategies.base_trending_strategy import BaseTrendingStrategy
from src.trending_strategies.default_trending_tracks_strategy import z
from src.trending_strategies.trending_type_and_version import TrendingType, TrendingVersion

class DefaultTrendingPlaylistsStrategy(BaseTrendingStrategy):
    def __init__(self):
        super().__init__(TrendingType.PLAYLISTS, TrendingVersion.DEFAULT)

    def get_track_score(self, time, track):
        return z(time, track)

    def get_score_params(self):
        return 1000
