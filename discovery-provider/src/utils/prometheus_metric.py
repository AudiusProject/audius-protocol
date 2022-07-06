import logging
from functools import wraps
from time import time
from typing import Callable, Dict

from prometheus_client import Gauge, Histogram

logger = logging.getLogger(__name__)


def save_duration_metric(metric_group):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            histogram_metric = PrometheusMetric(
                f"{metric_group}_completed_duration_seconds",
                f"How long a {metric_group} took to complete",
                ("func_name", "success"),
            )
            gauge_metric = PrometheusMetric(
                f"{metric_group}_last_duration_seconds",
                f"How long a {metric_group} has been running",
                ("func_name", "success"),
                metric_type=PrometheusType.GAUGE,
            )
            try:
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
                    raise e

        return wrapper

    return decorator


class PrometheusType:
    HISTOGRAM = "histogram"
    GAUGE = "gauge"


class PrometheusMetric:
    histograms: Dict[str, Histogram] = {}
    gauges: Dict[str, Gauge] = {}
    registered_collectors: Dict[str, Callable] = {}

    def __init_metric(
        self, name, description, labelnames, collection, prometheus_metric_cls
    ):
        if name not in collection:
            collection[name] = prometheus_metric_cls(
                name, description, labelnames=labelnames
            )
        self.metric = collection[name]

    def __init__(
        self, name, description, labelnames=(), metric_type=PrometheusType.HISTOGRAM
    ):
        self.reset_timer()

        # set metric prefix of audius_project_
        name = f"audius_dn_{name}"

        # CollectorRegistries must be uniquely named
        # NOTE: we only set labelnames once.
        # unsure if overloading is supported.
        self.metric_type = metric_type
        if self.metric_type == PrometheusType.HISTOGRAM:
            self.__init_metric(
                name, description, labelnames, PrometheusMetric.histograms, Histogram
            )
        elif self.metric_type == PrometheusType.GAUGE:
            self.__init_metric(
                name, description, labelnames, PrometheusMetric.gauges, Gauge
            )
        else:
            raise TypeError(f"metric_type '{self.metric_type}' not found")

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

        if self.metric_type == PrometheusType.HISTOGRAM:
            this_metric.observe(value)
        elif self.metric_type == PrometheusType.GAUGE:
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
