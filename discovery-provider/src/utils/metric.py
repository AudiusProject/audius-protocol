import logging
from time import time

from prometheus_client import Summary

logger = logging.getLogger(__name__)


class Metric:
    summaries = {}

    def __init__(self, name, description, labelnames=()):
        self.start_time = time()

        # CollectorRegistries must be uniquely named
        if name not in Metric.summaries:
            Metric.summaries[name] = Summary(name, description, labelnames=labelnames)
        self.h = Metric.summaries[name]

    def elapsed(self):
        return time() - self.start_time

    def save_time(self, labels=None):
        self.save(self.elapsed(), labels)

    def save(self, value, labels=None):
        if labels:
            logger.info(labels)
            self.h.labels(**labels).observe(value)
        else:
            self.h.observe(value)
