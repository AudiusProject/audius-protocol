from enum import Enum


class TrendingType(Enum):
    TRACKS = 1
    UNDERGROUND_TRACKS = 2
    PLAYLISTS = 3


class TrendingVersion(Enum):
    ePWJD = "ePWJD"
    aSPET = "aSPET"
    ML51L = "ML51L"
