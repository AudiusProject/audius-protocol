import logging
from datetime import datetime

import pytz
from src.monitors import monitor_names, monitors
from src.utils.prometheus_metric import PrometheusMetric, PrometheusType

logger = logging.getLogger(__name__)
MONITORS = monitors.MONITORS


# Returns active celery tasks
def get_celery_tasks():
    celery_tasks = monitors.get_monitors(
        [
            MONITORS[monitor_names.celery_tasks],
        ]
    )

    return celery_tasks


def convert_epoch_to_datetime(epoch):
    utc_dt = datetime.utcfromtimestamp(epoch).replace(tzinfo=pytz.utc)
    tz = pytz.timezone("America/New_York")  # keep US east as default timezone
    dt = utc_dt.astimezone(tz)
    return dt


def celery_tasks_prometheus_exporter():
    all_tasks = get_celery_tasks()["celery_tasks"]
    tasks = all_tasks["celery_tasks"]
    registered_tasks = all_tasks["registered_celery_tasks"]

    metric = PrometheusMetric(
        "active_celery_task_duration_seconds",
        "How long the currently running celery task has been running",
        labelnames=["task_name"],
        metric_type=PrometheusType.GAUGE,
    )

    active_task_names = []
    for task in tasks:
        try:
            metric.save_time(
                {"task_name": task["task_name"]}, start_time=task["started_at"]
            )
            active_task_names.append(task["task_name"])
        except:
            logger.exception(f"Processing failed for task: {task}")

    # send 0 values for inactive tasks
    for task in registered_tasks:
        if task["task_name"] not in active_task_names:
            metric.save(0, {"task_name": task["task_name"]})


PrometheusMetric.register_collector(
    "celery_tasks_prometheus_exporter", celery_tasks_prometheus_exporter
)
