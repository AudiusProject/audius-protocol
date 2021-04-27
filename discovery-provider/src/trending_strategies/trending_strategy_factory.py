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
        self.strategies = {
            TrendingType.TRACKS: {
                TrendingVersion.DEFAULT: DefaultTrendingTracksStrategy(),
                TrendingVersion.ePWJD: TrendingTracksStrategyePWJD()
            },
            TrendingType.UNDERGROUND_TRACKS: {
                TrendingVersion.DEFAULT: DefaultUndergroundTrendingTracksStrategy(),
                TrendingVersion.ePWJD: UndergroundTrendingTracksStrategyePWJD()
            },
            TrendingType.PLAYLISTS: {
                TrendingVersion.DEFAULT: DefaultTrendingPlaylistsStrategy(),
                TrendingVersion.ePWJD: TrendingPlaylistsStrategyePWJD()
            }
        }

    def get_strategy(self, trending_type, version=TrendingVersion.DEFAULT):
        return self.strategies[trending_type][version]

    def get_versions_for_type(self, trending_type):
        return self.strategies[trending_type]
