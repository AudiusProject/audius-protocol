from src.trending_strategies.eYZmn_trending_playlists_strategy import TrendingPlaylistsStrategyeYZmn
from src.trending_strategies.eYZmn_trending_tracks_strategy import TrendingTracksStrategyeYZmn
from src.trending_strategies.eYZmn_underground_trending_tracks_strategy \
    import UndergroundTrendingTracksStrategyeYZmn
from src.trending_strategies.ePWJD_trending_playlists_strategy import TrendingPlaylistsStrategyePWJD
from src.trending_strategies.ePWJD_trending_tracks_strategy import TrendingTracksStrategyePWJD
from src.trending_strategies.ePWJD_underground_trending_tracks_strategy import UndergroundTrendingTracksStrategyePWJD
from src.trending_strategies.trending_type_and_version import TrendingType, TrendingVersion

DEFAULT_TRENDING_VERSIONS = {
    TrendingType.TRACKS: TrendingVersion.eYZmn,
    TrendingType.UNDERGROUND_TRACKS: TrendingVersion.eYZmn,
    TrendingType.PLAYLISTS: TrendingVersion.eYZmn
}
class TrendingStrategyFactory:
    def __init__(self):
        self.strategies = {
            TrendingType.TRACKS: {
                TrendingVersion.eYZmn: TrendingTracksStrategyeYZmn(),
                TrendingVersion.ePWJD: TrendingTracksStrategyePWJD()
            },
            TrendingType.UNDERGROUND_TRACKS: {
                TrendingVersion.eYZmn: UndergroundTrendingTracksStrategyeYZmn(),
                TrendingVersion.ePWJD: UndergroundTrendingTracksStrategyePWJD()
            },
            TrendingType.PLAYLISTS: {
                TrendingVersion.eYZmn: TrendingPlaylistsStrategyeYZmn(),
                TrendingVersion.ePWJD: TrendingPlaylistsStrategyePWJD()
            }
        }

    def get_strategy(self, trending_type, version=None):
        if not version:
            version = DEFAULT_TRENDING_VERSIONS[trending_type]
        return self.strategies[trending_type][version]

    def get_versions_for_type(self, trending_type):
        return self.strategies[trending_type]
