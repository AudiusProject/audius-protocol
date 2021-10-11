from abc import ABC, abstractmethod
from sqlalchemy.orm.session import Session

from src.trending_strategies.trending_type_and_version import (
    TrendingType,
    TrendingVersion,
)


class BaseTrendingStrategy(ABC):
    def __init__(
        self, trending_type: TrendingType, version: TrendingVersion, use_mat_view=False
    ):
        self.trending_type = trending_type
        self.version = version
        self.use_mat_view = use_mat_view

    @abstractmethod
    def get_track_score(self, time: str, track):
        pass

    @abstractmethod
    def get_score_params(self):
        pass
