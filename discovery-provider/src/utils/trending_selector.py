from src.utils.default_trending_tracks_strategy import DefaultTrendingTracksStrategy
from src.utils.ePWJD_trending_tracks_strategy import TrendingTracksStrategyePWJD
from src.utils.default_underground_trending_tracks_strategy import DefaultUndergroundTrendingTracksStrategy
from src.utils.ePWJD_underground_trending_tracks_strategy import UndergroundTrendingTracksStrategyePWJD
from src.utils.default_trending_playlists_strategy import DefaultTrendingPlaylistsStrategy
from src.utils.ePWJD_trending_playlists_strategy import TrendingPlaylistsStrategyePWJD
from src.utils.trending_strategy import TrendingType, TrendingVersion

class TrendingSelector:
    def __init__(self):
        self.track_strategies = {
            TrendingVersion.DEFAULT: DefaultTrendingTracksStrategy(),
            TrendingVersion.ePWJD: TrendingTracksStrategyePWJD()
        }
        self.underground_track_strategies = {
            TrendingVersion.DEFAULT: DefaultUndergroundTrendingTracksStrategy(),
            TrendingVersion.ePWJD: UndergroundTrendingTracksStrategyePWJD()
        }
        self.playlist_strategies = {
            TrendingVersion.DEFAULT: DefaultTrendingPlaylistsStrategy(),
            TrendingVersion.ePWJD: TrendingPlaylistsStrategyePWJD()
        }

    def get_strategy(self, trending_type, version=TrendingVersion.DEFAULT):
        if trending_type == TrendingType.TRACKS:
            return self.track_strategies[version]
        if trending_type == TrendingType.UNDERGROUND_TRACKS:
            return self.underground_track_strategies[version]
        return self.playlist_strategies[version]
