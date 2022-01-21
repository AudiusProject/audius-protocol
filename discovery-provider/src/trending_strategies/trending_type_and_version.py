from enum import Enum


class TrendingType(Enum):
    TRACKS = 1
    UNDERGROUND_TRACKS = 2
    PLAYLISTS = 3


class TrendingVersion(Enum):
    ML51L = "ML51L"
    EJ57D = "EJ57D"
