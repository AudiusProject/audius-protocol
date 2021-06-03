import functools
import json
import logging # pylint: disable=C0302
from datetime import datetime, timedelta
import redis
from flask.globals import request
from src.utils.config import shared_config
from src.utils.helpers import get_ip, redis_set_and_dump, redis_get_or_restore
from src.utils.query_params import stringify_query_params, app_name_param
from src.models import AggregateDailyUniqueUsersMetrics, AggregateDailyTotalUsersMetrics, \
    AggregateMonthlyUniqueUsersMetrics, AggregateMonthlyTotalUsersMetrics, \
    AggregateDailyAppNameMetrics, AggregateMonthlyAppNameMetrics

logger = logging.getLogger(__name__)

REDIS_URL = shared_config["redis"]["url"]
REDIS = redis.Redis.from_url(url=REDIS_URL)

# interval in minutes for pulling metrics from other nodes
METRICS_INTERVAL = 5
# interval in minutes for synchronizing metrics from other nodes
SYNCHRONIZE_METRICS_INTERVAL = 180

# Redis Key Convention:
# API_METRICS:routes:<date>:<hour>
# API_METRICS:application:<date>:<hour>

metrics_prefix = "API_METRICS"
metrics_routes = "routes"
metrics_applications = "applications"
metrics_visited_nodes = "visited_nodes"
personal_route_metrics = "personal_route_metrics"
daily_route_metrics = "daily_route_metrics"
summed_unique_daily_metrics = "summed_unique_daily_metrics"
monthly_route_metrics = "monthly_route_metrics"
summed_unique_monthly_metrics = "summed_unique_monthly_metrics"
personal_app_metrics = "personal_app_metrics"
daily_app_metrics = "daily_app_metrics"
monthly_app_metrics = "monthly_app_metrics"

'''
NOTE: if you want to change the time interval to recording metrics,
change the `datetime_format` and func `get_rounded_date_time` to reflect the interval
ie. If you wanted to record metrics per minute:
datetime_format = "%Y/%m/%d:%H-%M" # Add the minute template
def get_rounded_date_time():
    return datetime.utcnow().replace(second=0, microsecond=0) # Remove rounding min.
'''
datetime_format = "%Y/%m/%d:%H"
datetime_format_secondary = "%Y/%m/%d:%H:%M"
day_format = datetime_format_secondary.split(':')[0]

def get_rounded_date_time():
    return datetime.utcnow().replace(minute=0, second=0, microsecond=0)

def format_ip(ip):
    # Replace the `:` character with an `_`  because we use : as the redis key delimiter
    return ip.strip().replace(":", "_")

def get_request_ip(request_obj):
    return format_ip(get_ip(request_obj))

def parse_metrics_key(key):
    """
    Validates that a key is correctly formatted and returns
    the source: (routes|applications), ip address, and date of key
    """
    if not key.startswith(metrics_prefix):
        logger.warning(f"Bad redis key inserted w/out metrics prefix {key}")
        return None

    fragments = key.split(':')
    if len(fragments) != 5:
        logger.warning(f"Bad redis key inserted: must have 5 parts {key}")
        return None

    _, source, ip, date, time = fragments
    # Replace the ipv6 _ delimiter back to :
    ip = ip.replace("_", ":")
    if source not in (metrics_routes, metrics_applications):
        logger.warning(f"Bad redis key inserted: must be routes or application {key}")
        return None
    date_time = datetime.strptime(f"{date}:{time}", datetime_format)

    return source, ip, date_time

def persist_summed_unique_counts(db, timestamp, summed_unique_daily_count, summed_unique_monthly_count):
    day_str = timestamp.split(':')[0]
    month_str = f"{day_str[:7]}/01"
    day = datetime.strptime(day_str, day_format).date()
    month = datetime.strptime(month_str, day_format).date()
    with db.scoped_session() as session:
        day_unique_record = (
            session.query(AggregateDailyUniqueUsersMetrics)
            .filter(AggregateDailyUniqueUsersMetrics.timestamp == day)
            .first()
        )
        if day_unique_record:
            logger.info(f"summed unique count record for day {day} before update: {day_unique_record.summed_count}")
            day_unique_record.summed_count = max(day_unique_record.summed_count or 0, summed_unique_daily_count)
            logger.info(f"summed unique count record for day {day} after update: {day_unique_record.summed_count}")
            session.add(day_unique_record)

        month_unique_record = (
            session.query(AggregateMonthlyUniqueUsersMetrics)
            .filter(AggregateMonthlyUniqueUsersMetrics.timestamp == month)
            .first()
        )
        if month_unique_record:
            logger.info(f"summed unique count record for month {month} before update: \
                {month_unique_record.summed_count}")
            month_unique_record.summed_count = max(month_unique_record.summed_count or 0, summed_unique_monthly_count)
            logger.info(f"summed unique count record for month {month} after update: \
                {month_unique_record.summed_count}")
            session.add(month_unique_record)

def persist_route_metrics(db, day, month, count, unique_daily_count, unique_monthly_count):
    with db.scoped_session() as session:
        day_unique_record = (
            session.query(AggregateDailyUniqueUsersMetrics)
            .filter(AggregateDailyUniqueUsersMetrics.timestamp == day)
            .first()
        )
        if day_unique_record:
            logger.info(f"unique count record for day {day} before adding new unique count \
                {unique_daily_count}: {day_unique_record.count}")
            day_unique_record.count += unique_daily_count
            logger.info(f"unique count record for day {day} after adding new unique count \
                {unique_daily_count}: {day_unique_record.count}")
        else:
            day_unique_record = AggregateDailyUniqueUsersMetrics(
                timestamp=day,
                count=unique_daily_count
            )
            logger.info(f"new record for daily unique count with day {day} and unique count {unique_daily_count}")
        session.add(day_unique_record)

        day_total_record = (
            session.query(AggregateDailyTotalUsersMetrics)
            .filter(AggregateDailyTotalUsersMetrics.timestamp == day)
            .first()
        )
        if day_total_record:
            logger.info(f"total count record for day {day} before adding new total count \
                {count}: {day_total_record.count}")
            day_total_record.count += count
            logger.info(f"total count record for day {day} after adding new total count \
                {count}: {day_total_record.count}")
        else:
            day_total_record = AggregateDailyTotalUsersMetrics(
                timestamp=day,
                count=count
            )
            logger.info(f"new record for daily total count with day {day} and total count {count}")
        session.add(day_total_record)

        month_unique_record = (
            session.query(AggregateMonthlyUniqueUsersMetrics)
            .filter(AggregateMonthlyUniqueUsersMetrics.timestamp == month)
            .first()
        )
        if month_unique_record:
            logger.info(f"unique count record for month {month} before adding new unique count \
                {unique_monthly_count}: {month_unique_record.count}")
            month_unique_record.count += unique_monthly_count
            logger.info(f"unique count record for month {month} after adding new unique count \
                {unique_monthly_count}: {month_unique_record.count}")
        else:
            month_unique_record = AggregateMonthlyUniqueUsersMetrics(
                timestamp=month,
                count=unique_monthly_count
            )
            logger.info(f"new record for monthly unique count with month {month} and unique count \
                {unique_monthly_count}")
        session.add(month_unique_record)

        month_total_record = (
            session.query(AggregateMonthlyTotalUsersMetrics)
            .filter(AggregateMonthlyTotalUsersMetrics.timestamp == month)
            .first()
        )
        if month_total_record:
            logger.info(f"total count record for month {month} before adding new total count \
                {count}: {month_total_record.count}")
            month_total_record.count += count
            logger.info(f"total count record for month {month} after adding new total count \
                {count}: {month_total_record.count}")
        else:
            month_total_record = AggregateMonthlyTotalUsersMetrics(
                timestamp=month,
                count=count
            )
            logger.info(f"new record for monthly total count with month {month} and total count {count}")
        session.add(month_total_record)

def persist_app_metrics(db, day, month, app_count):
    with db.scoped_session() as session:
        for application_name, count in app_count.items():
            day_record = (
                session.query(AggregateDailyAppNameMetrics)
                .filter(AggregateDailyAppNameMetrics.timestamp == day)
                .filter(AggregateDailyAppNameMetrics.application_name == application_name)
                .first()
            )
            if day_record:
                logger.info(f"daily app record for day {day} and application {application_name} \
                    before adding new count {count}: {day_record.count}")
                day_record.count += count
                logger.info(f"daily app record for day {day} and application {application_name} \
                    after adding new count {count}: {day_record.count}")
            else:
                day_record = AggregateDailyAppNameMetrics(
                    timestamp=day,
                    application_name=application_name,
                    count=count
                )
                logger.info(f"new record for daily app record with day {day}, \
                    application {application_name}, and count {count}")
            session.add(day_record)

            month_record = (
                session.query(AggregateMonthlyAppNameMetrics)
                .filter(AggregateMonthlyAppNameMetrics.timestamp == month)
                .filter(AggregateMonthlyAppNameMetrics.application_name == application_name)
                .first()
            )
            if month_record:
                logger.info(f"monthly app record for month {month} and application {application_name} \
                    before adding new count {count}: {month_record.count}")
                month_record.count += count
                logger.info(f"monthly app record for month {month} and application {application_name} \
                    after adding new count {count}: {month_record.count}")
            else:
                month_record = AggregateMonthlyAppNameMetrics(
                    timestamp=month,
                    application_name=application_name,
                    count=count
                )
                logger.info(f"new record for monthly app record with month {month}, \
                    application {application_name}, and count {count}")
            session.add(month_record)

def merge_metrics(metrics, end_time, metric_type, db):
    """
    Merge this node's metrics to those received from other discovery nodes:
        Update unique and total, daily and monthly metrics for routes and apps

        Dump the cached metrics so that if this node temporarily goes down,
        we can recover the IPs and app names to perform the calculation and deduplication
        when the node comes back up

        Clean up old metrics from cache

        Persist metrics in the database
    """
    logger.info(f"about to merge {metric_type} metrics: {len(metrics)} new entries")
    day = end_time.split(':')[0]
    month = f"{day[:7]}/01"

    daily_key = daily_route_metrics if metric_type == 'route' else daily_app_metrics
    daily_metrics_str = redis_get_or_restore(REDIS, daily_key)
    daily_metrics = json.loads(daily_metrics_str) if daily_metrics_str else {}

    monthly_key = monthly_route_metrics if metric_type == 'route' else monthly_app_metrics
    monthly_metrics_str = redis_get_or_restore(REDIS, monthly_key)
    monthly_metrics = json.loads(monthly_metrics_str) if monthly_metrics_str else {}

    if day not in daily_metrics:
        daily_metrics[day] = {}
    if month not in monthly_metrics:
        monthly_metrics[month] = {}

    # only relevant for unique users metrics
    unique_daily_count = 0
    unique_monthly_count = 0

    # only relevant for app metrics
    app_count = {}

    # update daily and monthly metrics, which could be route metrics or app metrics
    # if route metrics, new_value and new_count would be an IP and the number of requests from it
    # otherwise, new_value and new_count would be an app and the number of requests from it
    for new_value, new_count in metrics.items():
        if metric_type == 'route' and new_value not in daily_metrics[day]:
            unique_daily_count += 1
        if metric_type == 'route' and new_value not in monthly_metrics[month]:
            unique_monthly_count += 1
        if metric_type == 'app':
            app_count[new_value] = new_count
        daily_metrics[day][new_value] = daily_metrics[day][new_value] + new_count \
            if new_value in daily_metrics[day] else new_count
        monthly_metrics[month][new_value] = monthly_metrics[month][new_value] + new_count \
            if new_value in monthly_metrics[month] else new_count

    # clean up metrics METRICS_INTERVAL after the end of the day from daily_metrics
    yesterday_str = (datetime.utcnow() - timedelta(days=1)).strftime(datetime_format_secondary)
    daily_metrics = {timestamp: metrics for timestamp, metrics in daily_metrics.items() \
        if timestamp > yesterday_str}
    if daily_metrics:
        redis_set_and_dump(REDIS, daily_key, json.dumps(daily_metrics))
    logger.info(f"updated cached daily {metric_type} metrics")

    # clean up metrics METRICS_INTERVAL after the end of the month from monthly_metrics
    thirty_one_days_ago = (datetime.utcnow() - timedelta(days=31)).strftime(datetime_format_secondary)
    monthly_metrics = {timestamp: metrics for timestamp, metrics in monthly_metrics.items() \
        if timestamp > thirty_one_days_ago}
    if monthly_metrics:
        redis_set_and_dump(REDIS, monthly_key, json.dumps(monthly_metrics))
    logger.info(f"updated cached monthly {metric_type} metrics")

    # persist aggregated metrics from other nodes
    day_obj = datetime.strptime(day, day_format).date()
    month_obj = datetime.strptime(month, day_format).date()
    if metric_type == 'route':
        persist_route_metrics(db, day_obj, month_obj, sum(metrics.values()), unique_daily_count, unique_monthly_count)
    else:
        persist_app_metrics(db, day_obj, month_obj, app_count)

def merge_route_metrics(metrics, end_time, db):
    merge_metrics(metrics, end_time, 'route', db)

def merge_app_metrics(metrics, end_time, db):
    merge_metrics(metrics, end_time, 'app', db)

def get_redis_metrics(redis_handle, start_time, metric_type):
    redis_metrics_str = redis_get_or_restore(redis_handle, metric_type)
    metrics = json.loads(redis_metrics_str) if redis_metrics_str else {}
    if not metrics:
        return {}

    # if route metrics, value and count would be an IP and the number of requests from it
    # otherwise, value and count would be an app and the number of requests from it
    result = {}
    for datetime_str, value_counts in metrics.items():
        datetime_obj = datetime.strptime(datetime_str, datetime_format_secondary)
        if datetime_obj > start_time:
            for value, count in value_counts.items():
                result[value] = result[value] + count if value in result else count

    return result

def get_redis_route_metrics(start_time):
    return get_redis_metrics(REDIS, start_time, personal_route_metrics)

def get_redis_app_metrics(start_time):
    return get_redis_metrics(REDIS, start_time, personal_app_metrics)

def get_summed_unique_metrics(start_time):
    day = start_time.strftime(day_format)
    month = f"{day[:7]}/01"

    summed_unique_daily_metrics_str = redis_get_or_restore(REDIS, summed_unique_daily_metrics)
    summed_unique_daily_metrics_obj = json.loads(summed_unique_daily_metrics_str) \
        if summed_unique_daily_metrics_str else {}
    summed_unique_daily_count = len(summed_unique_daily_metrics_obj[day]) \
        if day in summed_unique_daily_metrics_obj else 0

    summed_unique_monthly_metrics_str = redis_get_or_restore(REDIS, summed_unique_monthly_metrics)
    summed_unique_monthly_metrics_obj = json.loads(summed_unique_monthly_metrics_str) \
        if summed_unique_monthly_metrics_str else {}
    summed_unique_monthly_count = len(summed_unique_monthly_metrics_obj[month]) \
        if month in summed_unique_monthly_metrics_obj else 0

    return {
        'daily': summed_unique_daily_count,
        'monthly': summed_unique_monthly_count
    }

def get_aggregate_metrics_info():
    info_str = redis_get_or_restore(REDIS, metrics_visited_nodes)
    return json.loads(info_str) if info_str else {}

def extract_app_name_key():
    """
    Extracts the application name redis key and hash from the request
    The key should be of format:
        <metrics_prefix>:<metrics_application>:<ip>:<rounded_date_time_format>
        ie: "API_METRICS:applications:192.168.0.1:2020/08/04:14"
    The hash should be of format:
        <app_name>
        ie: "audius_dapp"
    """
    application_name = request.args.get(app_name_param, type=str, default=None)
    ip = get_request_ip(request)
    date_time = get_rounded_date_time().strftime(datetime_format)

    application_key = f"{metrics_prefix}:{metrics_applications}:{ip}:{date_time}"
    return (application_key, application_name)

def extract_route_key():
    """
    Extracts the route redis key and hash from the request
    The key should be of format:
        <metrics_prefix>:<metrics_routes>:<ip>:<rounded_date_time_format>
        ie: "API_METRICS:routes:192.168.0.1:2020/08/04:14"
    The hash should be of format:
        <path><sorted_query_params>
        ie: "/v1/tracks/search?genre=rap&query=best"
    """
    path = request.path
    req_args = request.args.items()
    req_args = stringify_query_params(req_args)
    route = f"{path}?{req_args}" if req_args else path
    ip = get_request_ip(request)
    date_time = get_rounded_date_time().strftime(datetime_format)

    route_key = f"{metrics_prefix}:{metrics_routes}:{ip}:{date_time}"
    return (route_key, route)

def update_personal_metrics(key, old_timestamp, timestamp, value, metric_type):
    values_str = redis_get_or_restore(REDIS, key)
    values = json.loads(values_str) if values_str else {}
    if timestamp in values:
        values[timestamp][value] = values[timestamp][value] + 1 if value in values[timestamp] else 1
    else:
        values[timestamp] = {value: 1}

    # clean up and update cached metrics
    updated_metrics = {timestamp: metrics for timestamp, metrics in values.items() if timestamp > old_timestamp}
    if updated_metrics:
        redis_set_and_dump(REDIS, key, json.dumps(updated_metrics))
    logger.info(f"updated cached personal {metric_type} metrics")

def update_summed_unique_metrics(now, ip):
    thirty_one_days_ago = now - timedelta(days=31)
    thirty_one_days_ago_str = thirty_one_days_ago.strftime(day_format)
    yesterday = now - timedelta(days=1)
    yesterday_str = yesterday.strftime(day_format)
    today_str = now.strftime(day_format)
    this_month_str = f"{today_str[:7]}/01"

    summed_unique_daily_metrics_str = redis_get_or_restore(REDIS, summed_unique_daily_metrics)
    summed_unique_daily_metrics_obj = json.loads(summed_unique_daily_metrics_str) \
        if summed_unique_daily_metrics_str else {}
    if today_str not in summed_unique_daily_metrics_obj:
        summed_unique_daily_metrics_obj[today_str] = [ip]
    elif ip not in summed_unique_daily_metrics_obj[today_str]:
        summed_unique_daily_metrics_obj[today_str] = summed_unique_daily_metrics_obj[today_str] + [ip]
    summed_unique_daily_metrics_obj = {timestamp: ips for timestamp, ips in summed_unique_daily_metrics_obj.items() \
        if timestamp >= yesterday_str}
    redis_set_and_dump(REDIS, summed_unique_daily_metrics, json.dumps(summed_unique_daily_metrics_obj))

    summed_unique_monthly_metrics_str = redis_get_or_restore(REDIS, summed_unique_monthly_metrics)
    summed_unique_monthly_metrics_obj = json.loads(summed_unique_monthly_metrics_str) \
        if summed_unique_monthly_metrics_str else {}
    if this_month_str not in summed_unique_monthly_metrics_obj:
        summed_unique_monthly_metrics_obj[this_month_str] = [ip]
    elif ip not in summed_unique_monthly_metrics_obj[this_month_str]:
        summed_unique_monthly_metrics_obj[this_month_str] = summed_unique_monthly_metrics_obj[this_month_str] + [ip]
    summed_unique_monthly_metrics_obj = {timestamp: ips for timestamp, ips \
        in summed_unique_monthly_metrics_obj.items() if timestamp >= thirty_one_days_ago_str}
    redis_set_and_dump(REDIS, summed_unique_monthly_metrics, json.dumps(summed_unique_monthly_metrics_obj))

def record_aggregate_metrics():
    now = datetime.utcnow()
    timestamp = now.strftime(datetime_format_secondary)
    old_timestamp = (now - timedelta(minutes=METRICS_INTERVAL * 2)).strftime(datetime_format_secondary)
    ip = get_request_ip(request)

    update_summed_unique_metrics(now, ip)

    update_personal_metrics(
        personal_route_metrics, old_timestamp, timestamp, ip, 'route'
    )

    application_name = request.args.get(app_name_param, type=str, default=None)
    if application_name:
        update_personal_metrics(
            personal_app_metrics, old_timestamp, timestamp, application_name, 'app'
        )

# Metrics decorator.
def record_metrics(func):
    """
    The metrics decorator records each time a route is hit in redis
    The number of times a route is hit and an app_name query param are used are recorded.
    A redis a redis hash map is used to store each of these values.

    NOTE: This must be placed before the cache decorator in order for the redis incr to occur
    """
    @functools.wraps(func)
    def wrap(*args, **kwargs):
        try:
            application_key, application_name = extract_app_name_key()
            route_key, route = extract_route_key()
            REDIS.hincrby(route_key, route, 1)
            if application_name:
                REDIS.hincrby(application_key, application_name, 1)

            record_aggregate_metrics()
        except Exception as e:
            logger.error('Error while recording metrics: %s', e.message)

        return func(*args, **kwargs)
    return wrap
