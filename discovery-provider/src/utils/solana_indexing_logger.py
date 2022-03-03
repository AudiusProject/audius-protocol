import time
from typing import Dict, List


class SolanaIndexingLogger:
    def __init__(self, job: str):
        self.job = job
        self.init_time = time.time()
        self.log_time = time.time()
        self.logs: List[str] = []
        self.timers: Dict = {}
        self.durations: Dict = {}
        self.context: Dict = {}

    def start_time(self, label):
        self.timers[label] = {"start": time.time()}

    def end_time(self, label):
        if label in self.timers and "start" in self.timers[label]:
            duration = time.time() - self.timers[label]["start"]
            self.durations[label] = duration

    def add_log(self, log):
        current_time = time.time()
        duration = current_time - self.log_time
        self.logs.append(f"{log} (duration {duration} sec)")
        self.log_time = current_time

    def add_context(self, key, value):
        self.context[key] = value

    def get_context(self):
        return {
            "job": self.job,
            "logs": ",".join(self.logs),
            "total_time": time.time() - self.init_time,
            **self.durations,
            **self.context,
        }
