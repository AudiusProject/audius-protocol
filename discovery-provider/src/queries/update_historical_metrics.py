import logging
from src.models import DailyUniqueUsersMetrics, DailyTotalUsersMetrics, MonthlyUniqueUsersMetrics, \
    MonthlyTotalUsersMetrics, DailyAppNameMetrics, MonthlyAppNameMetrics

logger = logging.getLogger(__name__)

def update_historical_daily_route_metrics(db, metrics):
    with db.scoped_session() as session:
        for day, values in metrics.items():
            day_unique_record = (
                session.query(DailyUniqueUsersMetrics)
                .filter(DailyUniqueUsersMetrics.timestamp == day)
                .first()
            )
            if day_unique_record:
                day_unique_record.count = values['unique']
            else:
                day_unique_record = DailyUniqueUsersMetrics(
                    timestamp=day,
                    count=values['unique']
                )
            session.add(day_unique_record)

            day_total_record = (
                session.query(DailyTotalUsersMetrics)
                .filter(DailyTotalUsersMetrics.timestamp == day)
                .first()
            )
            if day_total_record:
                day_total_record.count = values['total']
            else:
                day_total_record = DailyTotalUsersMetrics(
                    timestamp=day,
                    count=values['total']
                )
            session.add(day_total_record)

def update_historical_monthly_route_metrics(db, metrics):
    with db.scoped_session() as session:
        for month, values in metrics.items():
            month_unique_record = (
                session.query(MonthlyUniqueUsersMetrics)
                .filter(MonthlyUniqueUsersMetrics.timestamp == month)
                .first()
            )
            if month_unique_record:
                month_unique_record.count = values['unique']
            else:
                month_unique_record = MonthlyUniqueUsersMetrics(
                    timestamp=month,
                    count=values['unique']
                )
            session.add(month_unique_record)

            month_total_record = (
                session.query(MonthlyTotalUsersMetrics)
                .filter(MonthlyTotalUsersMetrics.timestamp == month)
                .first()
            )
            if month_total_record:
                month_total_record.count = values['total']
            else:
                month_total_record = MonthlyTotalUsersMetrics(
                    timestamp=month,
                    count=values['total']
                )
            session.add(month_total_record)

def update_historical_daily_app_metrics(db, metrics):
    with db.scoped_session() as session:
        for day, values in metrics.items():
            for app, count in values.items():
                day_record = (
                    session.query(DailyAppNameMetrics)
                    .filter(DailyAppNameMetrics.timestamp == day)
                    .filter(DailyAppNameMetrics.application_name == app)
                    .first()
                )
                if day_record:
                    day_record.count = count
                else:
                    day_record = DailyAppNameMetrics(
                        timestamp=day,
                        application_name=app,
                        count=count
                    )
                session.add(day_record)

def update_historical_monthly_app_metrics(db, metrics):
    with db.scoped_session() as session:
        for month, values in metrics.items():
            for app, count in values.items():
                month_record = (
                    session.query(MonthlyAppNameMetrics)
                    .filter(MonthlyAppNameMetrics.timestamp == month)
                    .filter(MonthlyAppNameMetrics.application_name == app)
                    .first()
                )
                if month_record:
                    month_record.count = count
                else:
                    month_record = MonthlyAppNameMetrics(
                        timestamp=month,
                        application_name=app,
                        count=count
                    )
                session.add(month_record)
