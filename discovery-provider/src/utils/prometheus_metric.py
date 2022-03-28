from time import time
from typing import Callable, Dict

from prometheus_client import Gauge, Histogram


class PrometheusMetric:
    histograms: Dict[str, Histogram] = {}
    gauges: Dict[str, Gauge] = {}
    registered_collectors: Dict[str, Callable] = {}

    def __init__(self, name, description, labelnames=(), gauge=False):
        self.reset_timer()

        # set metric prefix of audius_project_
        name = f"audius_dn_{name}"

        # CollectorRegistries must be uniquely named
        # NOTE: we only set labelnames once.
        # unsure if overloading is supported.
        if gauge:
            if name not in PrometheusMetric.gauges:
                PrometheusMetric.gauges[name] = Gauge(
                    name, description, labelnames=labelnames
                )
            self.metric = PrometheusMetric.gauges[name]
        else:
            if name not in PrometheusMetric.histograms:
                PrometheusMetric.histograms[name] = Histogram(
                    name, description, labelnames=labelnames
                )
            self.metric = PrometheusMetric.histograms[name]

    def reset_timer(self):
        self.start_time = time()

    def elapsed(self, start_time=None):
        if start_time is None:
            start_time = self.start_time
        return time() - start_time

    def save_time(self, labels=None, start_time=None):
        self.save(self.elapsed(start_time), labels)

    def save(self, value, labels=None):
        if labels:
            self.metric.labels(**labels).observe(value)
        else:
            self.metric.observe(value)

    @classmethod
    def register_collector(cls, name, collector_func):
        cls.registered_collectors[name] = collector_func

    @classmethod
    def populate_collectors(cls):
        for collector in cls.registered_collectors.values():
            collector()
