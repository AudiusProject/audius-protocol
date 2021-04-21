from src.trending_strategies.default_trending_tracks_strategy import DefaultTrendingTracksStrategy
from src.trending_strategies.ePWJD_trending_tracks_strategy import TrendingTracksStrategyePWJD
from src.trending_strategies.default_underground_trending_tracks_strategy \
    import DefaultUndergroundTrendingTracksStrategy
from src.trending_strategies.ePWJD_underground_trending_tracks_strategy import UndergroundTrendingTracksStrategyePWJD
from src.trending_strategies.default_trending_playlists_strategy import DefaultTrendingPlaylistsStrategy
from src.trending_strategies.ePWJD_trending_playlists_strategy import TrendingPlaylistsStrategyePWJD
from src.trending_strategies.trending_type_and_version import TrendingType, TrendingVersion

class TrendingStrategyFactory:
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
