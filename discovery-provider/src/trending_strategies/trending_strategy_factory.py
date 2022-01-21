from src.trending_strategies.ML51L_trending_playlists_strategy import (
    TrendingPlaylistsStrategyML51L,
)
from src.trending_strategies.ML51L_trending_tracks_strategy import (
    TrendingTracksStrategyML51L,
)
from src.trending_strategies.ML51L_underground_trending_tracks_strategy import (
    UndergroundTrendingTracksStrategyML51L,
)
from src.trending_strategies.trending_type_and_version import (
    TrendingType,
    TrendingVersion,
)

DEFAULT_TRENDING_VERSIONS = {
    TrendingType.TRACKS: TrendingVersion.ML51L,
    TrendingType.UNDERGROUND_TRACKS: TrendingVersion.ML51L,
    TrendingType.PLAYLISTS: TrendingVersion.ML51L,
}


class TrendingStrategyFactory:
    def __init__(self):
        self.strategies = {
            TrendingType.TRACKS: {
                TrendingVersion.ML51L: TrendingTracksStrategyML51L(),
            },
            TrendingType.UNDERGROUND_TRACKS: {
                TrendingVersion.ML51L: UndergroundTrendingTracksStrategyML51L(),
            },
            TrendingType.PLAYLISTS: {
                TrendingVersion.ML51L: TrendingPlaylistsStrategyML51L(),
            },
        }

    def get_strategy(self, trending_type, version=None):
        if not version:
            version = DEFAULT_TRENDING_VERSIONS[trending_type]
        return self.strategies[trending_type][version]

    def get_versions_for_type(self, trending_type):
        return self.strategies[trending_type]
