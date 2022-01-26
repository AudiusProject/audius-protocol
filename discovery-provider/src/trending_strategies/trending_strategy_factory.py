from src.trending_strategies.EJ57D_trending_playlists_strategy import (
    TrendingPlaylistsStrategyEJ57D,
)
from src.trending_strategies.EJ57D_trending_tracks_strategy import (
    TrendingTracksStrategyEJ57D,
)
from src.trending_strategies.EJ57D_underground_trending_tracks_strategy import (
    UndergroundTrendingTracksStrategyEJ57D,
)
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
                TrendingVersion.EJ57D: TrendingTracksStrategyEJ57D(),
            },
            TrendingType.UNDERGROUND_TRACKS: {
                TrendingVersion.ML51L: UndergroundTrendingTracksStrategyML51L(),
                TrendingVersion.EJ57D: UndergroundTrendingTracksStrategyEJ57D(),
            },
            TrendingType.PLAYLISTS: {
                TrendingVersion.ML51L: TrendingPlaylistsStrategyML51L(),
                TrendingVersion.EJ57D: TrendingPlaylistsStrategyEJ57D(),
            },
        }

    def get_strategy(self, trending_type, version=None):
        if not version:
            version = DEFAULT_TRENDING_VERSIONS[trending_type]
        return self.strategies[trending_type][version]

    def get_versions_for_type(self, trending_type):
        return self.strategies[trending_type]
