import logging
from functools import wraps
from time import time
from typing import Callable, Dict

from prometheus_client import Gauge, Histogram

logger = logging.getLogger(__name__)


def save_duration_metric(metric_group):
    # a decorator that takes the `metric_group` parameter to create:
    # * a histogram for detecting duration and latency from a decorated function
    # * a gauge for reporting the last task's duration (in seconds)

    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            histogram_metric = PrometheusMetric(
                PrometheusMetricNames.CELERY_TASK_COMPLETED_DURATION_SECONDS
            )

            gauge_metric = PrometheusMetric(
                PrometheusMetricNames.CELERY_TASK_LAST_DURATION_SECONDS
            )
            try:
                # safely return this result under all circumstances
                result = func(*args, **kwargs)

                try:
                    histogram_metric.save_time(
                        {"func_name": func.__name__, "success": True}
                    )
                    gauge_metric.save_time(
                        {"func_name": func.__name__, "success": True}
                    )
                except Exception as e:
                    logger.exception("Failed to save successful metrics", e)
                finally:

                    # safely return the result out of the decorator
                    return result

            except Exception as e:
                try:
                    histogram_metric.save_time(
                        {"func_name": func.__name__, "success": False}
                    )
                    gauge_metric.save_time(
                        {"func_name": func.__name__, "success": False}
                    )
                except Exception as inner_e:
                    logger.exception("Failed to save unsuccessful metrics", inner_e)
                finally:

                    # safely raise the exception out of the decorator
                    raise e

        return wrapper

    return decorator


METRIC_PREFIX = "audius_dn"


class PrometheusMetricNames:
    CELERY_TASK_ACTIVE_DURATION_SECONDS = "celery_task_active_duration_seconds"
    CELERY_TASK_COMPLETED_DURATION_SECONDS = "celery_task_completed_duration_seconds"
    CELERY_TASK_LAST_DURATION_SECONDS = "celery_task_last_duration_seconds"
    FLASK_ROUTE_LATENCY_SECONDS = "flask_route_latency_seconds"
    HEALTH_CHECK_BLOCK_DIFFERENCE_CURRENT = "health_check_block_difference_current"
    HEALTH_CHECK_LATEST_INDEXED_BLOCK_NUM_CURRENT = (
        "health_check_latest_indexed_block_num_current"
    )
    INDEX_BLOCKS_DURATION_SECONDS = "index_blocks_duration_seconds"
    INDEX_METRICS_DURATION_SECONDS = "index_metrics_duration_seconds"
    INDEX_TRENDING_DURATION_SECONDS = "index_trending_duration_seconds"
    TRACK_STATE_UPDATE_DURATION_SECONDS = "track_state_update_duration_seconds"
    UPDATE_AGGREGATE_TABLE_LATENCY_SECONDS = "update_aggregate_table_latency_seconds"
    UPDATE_TRACK_IS_AVAILABLE_DURATION_SECONDS = (
        "update_track_is_available_duration_seconds"
    )
    UPDATE_TRENDING_VIEW_DURATION_SECONDS = "update_trending_view_duration_seconds"
    USER_STATE_UPDATE_DURATION_SECONDS = "user_state_update_duration_seconds"


PrometheusRegistry = {
    PrometheusMetricNames.CELERY_TASK_ACTIVE_DURATION_SECONDS: Gauge(
        f"{METRIC_PREFIX}_{PrometheusMetricNames.CELERY_TASK_ACTIVE_DURATION_SECONDS}",
        "How long the currently running celery task has been running",
        ("task_name",),
    ),
    PrometheusMetricNames.CELERY_TASK_COMPLETED_DURATION_SECONDS: Histogram(
        f"{METRIC_PREFIX}_{PrometheusMetricNames.CELERY_TASK_COMPLETED_DURATION_SECONDS}",
        "How long a celery_task took to complete",
        (
            "func_name",
            "success",
        ),
    ),
    PrometheusMetricNames.CELERY_TASK_LAST_DURATION_SECONDS: Gauge(
        f"{METRIC_PREFIX}_{PrometheusMetricNames.CELERY_TASK_LAST_DURATION_SECONDS}",
        "How long the last celery_task ran",
        (
            "func_name",
            "success",
        ),
    ),
    PrometheusMetricNames.FLASK_ROUTE_LATENCY_SECONDS: Histogram(
        f"{METRIC_PREFIX}_{PrometheusMetricNames.FLASK_ROUTE_LATENCY_SECONDS}",
        "Runtimes for flask routes",
        (
            "route",
            "code",
        ),
    ),
    PrometheusMetricNames.HEALTH_CHECK_BLOCK_DIFFERENCE_CURRENT: Gauge(
        f"{METRIC_PREFIX}_{PrometheusMetricNames.HEALTH_CHECK_BLOCK_DIFFERENCE_CURRENT}",
        "Difference between the latest block and the latest indexed block",
    ),
    PrometheusMetricNames.HEALTH_CHECK_LATEST_INDEXED_BLOCK_NUM_CURRENT: Gauge(
        f"{METRIC_PREFIX}_{PrometheusMetricNames.HEALTH_CHECK_LATEST_INDEXED_BLOCK_NUM_CURRENT}",
        "Latest indexed block number",
    ),
    PrometheusMetricNames.INDEX_BLOCKS_DURATION_SECONDS: Histogram(
        f"{METRIC_PREFIX}_{PrometheusMetricNames.INDEX_BLOCKS_DURATION_SECONDS}",
        "Runtimes for src.task.index:index_blocks()",
        ("scope",),
    ),
    PrometheusMetricNames.INDEX_METRICS_DURATION_SECONDS: Histogram(
        f"{METRIC_PREFIX}_{PrometheusMetricNames.INDEX_METRICS_DURATION_SECONDS}",
        "Runtimes for src.task.index_metrics:celery.task()",
        ("task_name",),
    ),
    PrometheusMetricNames.INDEX_TRENDING_DURATION_SECONDS: Histogram(
        f"{METRIC_PREFIX}_{PrometheusMetricNames.INDEX_TRENDING_DURATION_SECONDS}",
        "Runtimes for src.task.index_trending:index_trending()",
    ),
    PrometheusMetricNames.TRACK_STATE_UPDATE_DURATION_SECONDS: Histogram(
        f"{METRIC_PREFIX}_{PrometheusMetricNames.TRACK_STATE_UPDATE_DURATION_SECONDS}",
        "Runtimes for src.task.tracks:track_state_update()",
        ("scope",),
    ),
    PrometheusMetricNames.UPDATE_AGGREGATE_TABLE_LATENCY_SECONDS: Histogram(
        f"{METRIC_PREFIX}_{PrometheusMetricNames.UPDATE_AGGREGATE_TABLE_LATENCY_SECONDS}",
        "Runtimes for src.task.aggregates:update_aggregate_table()",
        ("table_name", "task_name"),
    ),
    PrometheusMetricNames.UPDATE_TRACK_IS_AVAILABLE_DURATION_SECONDS: Histogram(
        f"{METRIC_PREFIX}_{PrometheusMetricNames.UPDATE_TRACK_IS_AVAILABLE_DURATION_SECONDS}",
        "Runtimes for src.task.update_track_is_available:celery.task()",
        ("task_name", "success"),
    ),
    PrometheusMetricNames.UPDATE_TRENDING_VIEW_DURATION_SECONDS: Histogram(
        f"{METRIC_PREFIX}_{PrometheusMetricNames.UPDATE_TRENDING_VIEW_DURATION_SECONDS}",
        "Runtimes for src.task.index_trending:update_view()",
        ("mat_view_name",),
    ),
    PrometheusMetricNames.USER_STATE_UPDATE_DURATION_SECONDS: Histogram(
        f"{METRIC_PREFIX}_{PrometheusMetricNames.USER_STATE_UPDATE_DURATION_SECONDS}",
        "Runtimes for src.task.users:user_state_update()",
        ("scope",),
    ),
}


class PrometheusMetric:
    registered_collectors: Dict[str, Callable] = {}

    def __init__(self, name):
        self.reset_timer()

        if name not in PrometheusRegistry:
            raise NameError(f"Metric name '{name}' not found")
        self.metric = PrometheusRegistry[name]

    def reset_timer(self):
        self.start_time = time()

    def elapsed(self, start_time=None):
        if start_time is None:
            start_time = self.start_time
        return time() - start_time

    def save_time(self, labels=None, start_time=None):
        self.save(self.elapsed(start_time), labels)

    def save(self, value, labels=None):
        this_metric = self.metric
        if labels:
            this_metric = this_metric.labels(**labels)

        if isinstance(this_metric, Histogram):
            this_metric.observe(value)
        elif isinstance(this_metric, Gauge):
            this_metric.set(value)

    @classmethod
    def register_collector(cls, name, collector_func):
        cls.registered_collectors[name] = collector_func

    @classmethod
    def populate_collectors(cls):
        for name, collector in cls.registered_collectors.items():
            try:
                collector()
            except:
                logger.exception(f"Failure to collect '{name}'")
