from src.utils.default_trending_tracks_strategy import DefaultTrendingTracksStrategy
from src.utils.secondary_trending_tracks_strategy import SecondaryTrendingTracksStrategy
from src.utils.default_underground_trending_tracks_strategy import DefaultUndergroundTrendingTracksStrategy
from src.utils.secondary_underground_trending_tracks_strategy import SecondaryUndergroundTrendingTracksStrategy
from src.utils.default_trending_playlists_strategy import DefaultTrendingPlaylistsStrategy
from src.utils.secondary_trending_playlists_strategy import SecondaryTrendingPlaylistsStrategy
from src.utils.trending_strategy import TrendingType, TrendingVersion

class TrendingSelector:
    def __init__(self):
        self.track_strategies = {
            TrendingVersion.DEFAULT: DefaultTrendingTracksStrategy(),
            TrendingVersion.SECONDARY: SecondaryTrendingTracksStrategy()
        }
        self.underground_track_strategies = {
            TrendingVersion.DEFAULT: DefaultUndergroundTrendingTracksStrategy(),
            TrendingVersion.SECONDARY: SecondaryUndergroundTrendingTracksStrategy()
        }
        self.playlist_strategies = {
            TrendingVersion.DEFAULT: DefaultTrendingPlaylistsStrategy(),
            TrendingVersion.SECONDARY: SecondaryTrendingPlaylistsStrategy()
        }

    def get_strategy(self, trending_type, version=TrendingVersion.DEFAULT):
        if trending_type == TrendingType.TRACKS:
            return self.track_strategies[version]
        if trending_type == TrendingType.UNDERGROUND_TRACKS:
            return self.underground_track_strategies[version]
        return self.playlist_strategies[version]
