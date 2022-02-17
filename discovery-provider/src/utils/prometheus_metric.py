from time import time

from prometheus_client import Histogram


class PrometheusMetric:
    histograms = {}

    def __init__(self, name, description, labelnames=()):
        self.start_time = time()

        # CollectorRegistries must be uniquely named
        if name not in PrometheusMetric.histograms:
            PrometheusMetric.histograms[name] = Histogram(
                name, description, labelnames=labelnames
            )
        self.h = PrometheusMetric.histograms[name]

    def elapsed(self):
        return time() - self.start_time

    def save_time(self, labels=None):
        self.save(self.elapsed(), labels)

    def save(self, value, labels=None):
        if labels:
            self.h.labels(**labels).observe(value)
        else:
            self.h.observe(value)
