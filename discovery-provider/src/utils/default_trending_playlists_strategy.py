from src.utils.default_trending_tracks_strategy import z
from src.utils.trending_strategy import TrendingType, TrendingVersion

class DefaultTrendingPlaylistsStrategy:
    def __init__(self):
        self.trending_type = TrendingType.PLAYLISTS
        self.version = TrendingVersion.DEFAULT

    def get_track_score(self, time, track):
        return z(time, track)
