import logging

from src.models.metrics.aggregate_daily_app_name_metrics import (
    AggregateDailyAppNameMetric,
)
from src.models.metrics.aggregate_daily_total_users_metrics import (
    AggregateDailyTotalUsersMetrics,
)
from src.models.metrics.aggregate_daily_unique_users_metrics import (
    AggregateDailyUniqueUsersMetrics,
)
from src.models.metrics.aggregate_monthly_app_name_metrics import (
    AggregateMonthlyAppNameMetric,
)
from src.models.metrics.aggregate_monthly_total_users_metrics import (
    AggregateMonthlyTotalUsersMetric,
)
from src.models.metrics.aggregate_monthly_unique_users_metrics import (
    AggregateMonthlyUniqueUsersMetric,
)

logger = logging.getLogger(__name__)


def update_historical_daily_route_metrics(db, metrics):
    with db.scoped_session() as session:
        for day, values in metrics.items():
            day_unique_record = (
                session.query(AggregateDailyUniqueUsersMetrics)
                .filter(AggregateDailyUniqueUsersMetrics.timestamp == day)
                .first()
            )
            if day_unique_record:
                day_unique_record.count = values["unique_count"]
                day_unique_record.summed_count = values["summed_unique_count"]
            else:
                day_unique_record = AggregateDailyUniqueUsersMetrics(
                    timestamp=day,
                    count=values["unique_count"],
                    summed_count=values["summed_unique_count"],
                )
            session.add(day_unique_record)

            day_total_record = (
                session.query(AggregateDailyTotalUsersMetrics)
                .filter(AggregateDailyTotalUsersMetrics.timestamp == day)
                .first()
            )
            if day_total_record:
                day_total_record.count = values["total_count"]
            else:
                day_total_record = AggregateDailyTotalUsersMetrics(
                    timestamp=day, count=values["total_count"]
                )
            session.add(day_total_record)


def update_historical_monthly_route_metrics(db, metrics):
    with db.scoped_session() as session:
        for month, values in metrics.items():
            month_unique_record = (
                session.query(AggregateMonthlyUniqueUsersMetric)
                .filter(AggregateMonthlyUniqueUsersMetric.timestamp == month)
                .first()
            )
            if month_unique_record:
                month_unique_record.count = values["unique_count"]
                month_unique_record.summed_count = values["summed_unique_count"]
            else:
                month_unique_record = AggregateMonthlyUniqueUsersMetric(
                    timestamp=month,
                    count=values["unique_count"],
                    summed_count=values["summed_unique_count"],
                )
            session.add(month_unique_record)

            month_total_record = (
                session.query(AggregateMonthlyTotalUsersMetric)
                .filter(AggregateMonthlyTotalUsersMetric.timestamp == month)
                .first()
            )
            if month_total_record:
                month_total_record.count = values["total_count"]
            else:
                month_total_record = AggregateMonthlyTotalUsersMetric(
                    timestamp=month, count=values["total_count"]
                )
            session.add(month_total_record)


def update_historical_daily_app_metrics(db, metrics):
    with db.scoped_session() as session:
        for day, values in metrics.items():
            for app, count in values.items():
                day_record = (
                    session.query(AggregateDailyAppNameMetric)
                    .filter(AggregateDailyAppNameMetric.timestamp == day)
                    .filter(AggregateDailyAppNameMetric.application_name == app)
                    .first()
                )
                if day_record:
                    day_record.count = count
                else:
                    day_record = AggregateDailyAppNameMetric(
                        timestamp=day, application_name=app, count=count
                    )
                session.add(day_record)


def update_historical_monthly_app_metrics(db, metrics):
    with db.scoped_session() as session:
        for month, values in metrics.items():
            for app, count in values.items():
                month_record = (
                    session.query(AggregateMonthlyAppNameMetric)
                    .filter(AggregateMonthlyAppNameMetric.timestamp == month)
                    .filter(AggregateMonthlyAppNameMetric.application_name == app)
                    .first()
                )
                if month_record:
                    month_record.count = count
                else:
                    month_record = AggregateMonthlyAppNameMetric(
                        timestamp=month, application_name=app, count=count
                    )
                session.add(month_record)
