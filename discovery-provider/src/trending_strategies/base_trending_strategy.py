from abc import ABC, abstractmethod
from src.trending_strategies.trending_type_and_version import TrendingType, TrendingVersion

class BaseTrendingStrategy(ABC):
    def __init__(self, trending_type, version):
        self.trending_type = TrendingType.UNDERGROUND_TRACKS
        self.version = TrendingVersion.DEFAULT

    @abstractmethod
    def get_track_score(self, time, track):
        pass

    @abstractmethod
    def get_score_params(self):
        pass
