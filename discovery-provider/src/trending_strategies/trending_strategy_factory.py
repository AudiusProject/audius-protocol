from src.trending_strategies.BDNxn_trending_playlists_strategy import (
    TrendingPlaylistsStrategyBDNxn,
)
from src.trending_strategies.EJ57D_trending_tracks_strategy import (
    TrendingTracksStrategyEJ57D,
)
from src.trending_strategies.EJ57D_underground_trending_tracks_strategy import (
    UndergroundTrendingTracksStrategyEJ57D,
)
from src.trending_strategies.trending_type_and_version import (
    TrendingType,
    TrendingVersion,
)

DEFAULT_TRENDING_VERSIONS = {
    TrendingType.TRACKS: TrendingVersion.EJ57D,
    TrendingType.UNDERGROUND_TRACKS: TrendingVersion.EJ57D,
    TrendingType.PLAYLISTS: TrendingVersion.BDNxn,
}


class TrendingStrategyFactory:
    def __init__(self):
        self.strategies = {
            TrendingType.TRACKS: {
                TrendingVersion.EJ57D: TrendingTracksStrategyEJ57D(),
            },
            TrendingType.UNDERGROUND_TRACKS: {
                TrendingVersion.EJ57D: UndergroundTrendingTracksStrategyEJ57D(),
            },
            TrendingType.PLAYLISTS: {
                TrendingVersion.BDNxn: TrendingPlaylistsStrategyBDNxn(),
            },
        }

    def get_strategy(self, trending_type, version=None):
        if not version:
            version = DEFAULT_TRENDING_VERSIONS[trending_type]
        return self.strategies[trending_type][version]

    def get_versions_for_type(self, trending_type):
        return self.strategies[trending_type]
