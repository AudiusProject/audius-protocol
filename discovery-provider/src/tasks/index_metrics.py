import logging
from src.models import RouteMetrics, AppNameMetrics
from src.tasks.celery_app import celery

from src.utils.redis_metrics import metrics_prefix, metrics_application, \
    metrics_routes, parse_metrics_key, get_rounded_date_time

logger = logging.getLogger(__name__)


def process_route_keys(session, redis, key, ip, date):
    """
    For a redis hset storing a mapping of routes to the number of times they are hit,
    parse each key out into the version, path, and query string.
    Create a new entry in the DB for the each route.
    """
    try:
        route_metrics = []
        routes = redis.hgetall(key)
        for key_bstr in routes:
            route = key_bstr.decode('utf-8').strip('/')
            val = int(routes[key_bstr].decode('utf-8'))

            version = "0" # default value if version is not present
            path = route
            query_string = None

            route_subpaths = route.split('/')

            # Extract the version out of the path
            if route_subpaths[0].startswith('v') and len(route_subpaths[0]) > 1:
                version = route_subpaths[0][1:]
                path = '/'.join(route_subpaths[1:])

            # Extract the query string out of the path
            route_query = path.split('?')
            if len(route_query) > 1:
                path = route_query[0]
                query_string = route_query[1]
            route_metrics.append(
                RouteMetrics(
                    version=version,
                    route_path=path,
                    query_string=query_string,
                    count=val,
                    ip=ip,
                    timestamp=date
                )
            )

        if route_metrics:
            session.bulk_save_objects(route_metrics)
        redis.delete(key)
    except Exception as e:
        raise Exception("Error processing route key %s with error %s" % (key, e))

def process_app_name_keys(session, redis, key, ip, date):
    """
    For a redis hset storing a mapping of app_name usage in request parameters to count,
    Create a new entry in the DB for each app_name.
    """
    try:
        app_name_metrics = []
        routes = redis.hgetall(key)
        for key_bstr in routes:
            app_name = key_bstr.decode('utf-8')
            val = int(routes[key_bstr].decode('utf-8'))

            app_name_metrics.append(
                AppNameMetrics(
                    application_name=app_name,
                    count=val,
                    ip=ip,
                    timestamp=date
                )
            )
        if app_name_metrics:
            session.bulk_save_objects(app_name_metrics)
        redis.delete(key)

    except Exception as e:
        raise Exception("Error processing app name key %s with error %s" % (key, e))

def sweep_metrics(db, redis):
    """
    Move the metrics values from redis to the DB.

    Get all the redis keys with the metrics prefix,
    parse the key to get the timestamp in the key.
    If it is before the current time, then process the redis hset.
    """
    with db.scoped_session() as session:
        for key_byte in redis.scan_iter(f"{metrics_prefix}:*"):
            key = key_byte.decode("utf-8")
            try:
                parsed_key = parse_metrics_key(key)

                if parsed_key is None:
                    raise KeyError(f"index_metrics.py | Unable to parse key {key} | Skipping process key")
                source, ip, key_date = parsed_key

                current_date_time = get_rounded_date_time()

                if key_date < current_date_time:
                    if source == metrics_routes:
                        process_route_keys(session, redis, key, ip, key_date)
                    elif source == metrics_application:
                        process_app_name_keys(session, redis, key, ip, key_date)
            except KeyError as e:
                logger.warning(e)
                redis.delete(key)
            except Exception as e:
                logger.error(e)
                redis.delete(key)

######## CELERY TASK ########


@celery.task(name="update_metrics", bind=True)
def update_metrics(self):
    # Cache custom task class properties
    # Details regarding custom task context can be found in wiki
    # Custom Task definition can be found in src/__init__.py
    db = update_metrics.db
    redis = update_metrics.redis

    # Define lock acquired boolean
    have_lock = False

    # Define redis lock object
    update_lock = redis.lock("update_metrics_lock", blocking_timeout=25)
    try:
        # Attempt to acquire lock - do not block if unable to acquire
        have_lock = update_lock.acquire(blocking=False)
        if have_lock:
            logger.info(
                f"index_metrics.py | update_metrics | {self.request.id} | Acquired update_metrics_lock")
            sweep_metrics(db, redis)
            logger.info(
                f"index_metrics.py | update_metrics | {self.request.id} | Processing complete within session")
        else:
            logger.error(
                f"index_metrics.py | update_metrics | {self.request.id} | Failed to acquire update_metrics_lock")
    except Exception as e:
        logger.error(
            "Fatal error in main loop of update_metrics: %s", e, exc_info=True)
        raise e
    finally:
        if have_lock:
            update_lock.release()
