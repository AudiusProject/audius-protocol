from time import time


class Metric:
    def __init__(self):
        self.start_time = time()

    def save_time(self, session, metric_name):
        metric = Metric(
            metric_name=metric_name,
            value=time() - self.start_time,
        )
        session.add(metric)

    def save(self, session, metric_name, value):
        metric = Metric(
            metric_name=metric_name,
            value=value,
        )
        session.add(metric)
