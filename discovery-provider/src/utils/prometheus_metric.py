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
            if metric_group == "celery_task":
                histogram_metric = PrometheusMetric(
                    PrometheusMetricNames.CELERY_TASK_DURATION_SECONDS
                )
                gauge_metric = PrometheusMetric(
                    PrometheusMetricNames.CELERY_TASK_LAST_DURATION_SECONDS
                )
            else:
                raise NameError(f"Metric Group '{metric_group}' not found.")
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
    """
    Attempt to group metrics with high_level prefixes like:
    * `flask_`
    * `celery_task_`

    Antepenultimate Suffixes:
    * `_active` when measuring runtimes of actively running processes that are yet to be
      completed
    * `_last` when the last completed runtime is needed (duration in seconds)
    * (default: do not use) `_completed` is always implied if the other two are missing.
      Used when measuring runtimes of completed processes.

    Penultimate Suffixes:
    * `_duration` when measuring task duration or runtimes

    Suffixes:
    * `_seconds` always the base unit (never microseconds, milliseconds, etc)
    * `_latest` when looking at a snapshot of unit-less data
    * `_info` for a pseudo-metric that provides metadata about the running binary

    Ultimate Suffixes:
    * `_total`, when accumulating a count, in addition to above suffixes if applicable

    See the following resources for related information:
    * [Creator Node's docs](https://github.com/AudiusProject/audius-protocol/blob/master/creator-node/src/services/prometheusMonitoring/README.md)
    * [Official docs](https://prometheus.io/docs/practices/naming)
    """

    CELERY_TASK_ACTIVE_DURATION_SECONDS = "celery_task_active_duration_seconds"
    CELERY_TASK_DURATION_SECONDS = "celery_task_duration_seconds"
    CELERY_TASK_LAST_DURATION_SECONDS = "celery_task_last_duration_seconds"
    FLASK_ROUTE_DURATION_SECONDS = "flask_route_duration_seconds"
    HEALTH_CHECK_BLOCK_DIFFERENCE_LATEST = "health_check_block_difference_latest"
    HEALTH_CHECK_INDEXED_BLOCK_NUM_LATEST = "health_check_indexed_block_num_latest"
    INDEX_BLOCKS_DURATION_SECONDS = "index_blocks_duration_seconds"
    INDEX_METRICS_DURATION_SECONDS = "index_metrics_duration_seconds"
    INDEX_TRENDING_DURATION_SECONDS = "index_trending_duration_seconds"
    TRACK_STATE_UPDATE_DURATION_SECONDS = "track_state_update_duration_seconds"
    UPDATE_AGGREGATE_TABLE_DURATION_SECONDS = "update_aggregate_table_duration_seconds"
    UPDATE_TRACK_IS_AVAILABLE_DURATION_SECONDS = (
        "update_track_is_available_duration_seconds"
    )
    UPDATE_TRENDING_VIEW_DURATION_SECONDS = "update_trending_view_duration_seconds"
    USER_STATE_UPDATE_DURATION_SECONDS = "user_state_update_duration_seconds"


"""
Metric Types:

* Prometheus Gauges: Prometheus Gauges (not to be confused with the Grafana Panel Type
  which is a UI element which looks like a speedometer) will export a single metric
  which is useful for point-in-time collection.
* Prometheus Histograms: Histograms are far more common, especially when timing how long
  code runs, since a single metric endpoint will be exploded to create 11 additional
  metrics (sum, count, and 9 statistical buckets).
    * When looking at the raw /prometheus_metrics endpoint for
      `audius_dn_update_aggregate_table_latency_seconds_bucket`, you can see how a
      single metric explodes into multiple statistical helpers.

Labels:

Only use labels when labeling across **low-cardinality** of options.

As a general guideline, try to keep the cardinality of your metrics below 10, and for
metrics that exceed that, aim to limit them to a handful across your whole system.
The vast majority of your metrics should have no labels.

A few example labels:

* `scope` is used when measuring a larger unit of work that may have subtasks we want to
  measure runtimes for.
    * `{scope=”full”}` is reserved for the larger base unit of work
* `task_name` when similar CeleryTasks use the same helper code from different callers
"""
PrometheusRegistry = {
    PrometheusMetricNames.CELERY_TASK_ACTIVE_DURATION_SECONDS: Gauge(
        f"{METRIC_PREFIX}_{PrometheusMetricNames.CELERY_TASK_ACTIVE_DURATION_SECONDS}",
        "How long the currently running celery task has been running",
        ("task_name",),
    ),
    PrometheusMetricNames.CELERY_TASK_DURATION_SECONDS: Histogram(
        f"{METRIC_PREFIX}_{PrometheusMetricNames.CELERY_TASK_DURATION_SECONDS}",
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
    PrometheusMetricNames.FLASK_ROUTE_DURATION_SECONDS: Histogram(
        f"{METRIC_PREFIX}_{PrometheusMetricNames.FLASK_ROUTE_DURATION_SECONDS}",
        "Runtimes for flask routes",
        (
            "code",
            "route",
        ),
    ),
    PrometheusMetricNames.HEALTH_CHECK_BLOCK_DIFFERENCE_LATEST: Gauge(
        f"{METRIC_PREFIX}_{PrometheusMetricNames.HEALTH_CHECK_BLOCK_DIFFERENCE_LATEST}",
        "Difference between the latest block and the latest indexed block",
    ),
    PrometheusMetricNames.HEALTH_CHECK_INDEXED_BLOCK_NUM_LATEST: Gauge(
        f"{METRIC_PREFIX}_{PrometheusMetricNames.HEALTH_CHECK_INDEXED_BLOCK_NUM_LATEST}",
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
    PrometheusMetricNames.UPDATE_AGGREGATE_TABLE_DURATION_SECONDS: Histogram(
        f"{METRIC_PREFIX}_{PrometheusMetricNames.UPDATE_AGGREGATE_TABLE_DURATION_SECONDS}",
        "Runtimes for src.task.aggregates:update_aggregate_table()",
        (
            "table_name",
            "task_name",
        ),
    ),
    PrometheusMetricNames.UPDATE_TRACK_IS_AVAILABLE_DURATION_SECONDS: Histogram(
        f"{METRIC_PREFIX}_{PrometheusMetricNames.UPDATE_TRACK_IS_AVAILABLE_DURATION_SECONDS}",
        "Runtimes for src.task.update_track_is_available:celery.task()",
        (
            "success",
            "task_name",
        ),
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
