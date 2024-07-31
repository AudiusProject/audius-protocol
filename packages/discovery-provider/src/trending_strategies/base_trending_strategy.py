from abc import ABC, abstractmethod

from src.trending_strategies.trending_type_and_version import (
    TrendingType,
    TrendingVersion,
)


class BaseTrendingStrategy(ABC):
    def __init__(self, trending_type: TrendingType, version: TrendingVersion):
        self.trending_type = trending_type
        self.version = version

    @abstractmethod
    def get_track_score(self, time_range: str, track):
        pass

    @abstractmethod
    def get_score_params(self):
        pass
