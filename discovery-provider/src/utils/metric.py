from time import time

from prometheus_client import Histogram


class Metric:
    def __init__(self, histogram_name, historgram_description):
        self.start_time = time()
        self.h = Histogram(histogram_name, historgram_description)

    def elapsed(self):
        return time() - self.start_time

    def save_time(self, labels=None):
        self.h.observe(self.elapsed(), labels=labels)

    def save(self, value, labels=None):
        self.h.observe(value, labels=labels)
