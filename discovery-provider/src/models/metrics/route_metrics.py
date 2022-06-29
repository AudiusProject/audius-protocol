from sqlalchemy import Column, DateTime, Integer, String, func
from src.models.base import Base


class RouteMetrics(Base):
    __tablename__ = "route_metrics"

    id = Column(Integer, primary_key=True)
    version = Column(String, nullable=True)
    route_path = Column(String, nullable=False)
    query_string = Column(String, nullable=True, default="")
    count = Column(Integer, nullable=False)
    ip = Column(String, nullable=False)
    timestamp = Column(DateTime, nullable=False, default=func.now())
    created_at = Column(DateTime, nullable=False, default=func.now())
    updated_at = Column(
        DateTime, nullable=False, default=func.now(), onupdate=func.now()
    )

    def __repr__(self):
        return f"<RouteMetrics(\
version={self.version},\
route_path={self.route_path},\
query_string={self.query_string},\
count={self.count},\
ip={self.ip},\
timestamp={self.timestamp},\
created_at={self.created_at},\
updated_at={self.updated_at}"
