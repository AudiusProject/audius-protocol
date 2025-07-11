from src.trending_strategies.AnlGe_trending_tracks_strategy import (
    TrendingTracksStrategyAnlGe,
)
from src.trending_strategies.pnagD_trending_playlists_strategy import (
    TrendingPlaylistsStrategypnagD,
)
from src.trending_strategies.trending_type_and_version import (
    TrendingType,
    TrendingVersion,
)

DEFAULT_TRENDING_VERSIONS = {
    TrendingType.TRACKS: TrendingVersion.AnlGe,
    TrendingType.UNDERGROUND_TRACKS: TrendingVersion.AnlGe,
    TrendingType.PLAYLISTS: TrendingVersion.pnagD,
}


class TrendingStrategyFactory:
    def __init__(self):
        self.strategies = {
            TrendingType.TRACKS: {
                TrendingVersion.AnlGe: TrendingTracksStrategyAnlGe(),
            },
            TrendingType.UNDERGROUND_TRACKS: {
                TrendingVersion.AnlGe: TrendingTracksStrategyAnlGe(),
            },
            TrendingType.PLAYLISTS: {
                TrendingVersion.pnagD: TrendingPlaylistsStrategypnagD(),
            },
        }

    def get_strategy(self, trending_type, version=None):
        if not version:
            version = DEFAULT_TRENDING_VERSIONS[trending_type]
        return self.strategies[trending_type][version]

    def get_versions_for_type(self, trending_type):
        return self.strategies[trending_type]
