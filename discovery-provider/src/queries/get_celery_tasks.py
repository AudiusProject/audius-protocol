from typing import List, TypedDict

from src.tasks.celery import celery
from src.utils.prometheus_metric import PrometheusMetric, PrometheusType


class GetTasksItem(TypedDict):

    # Id of the Celery Task
    task_id: str

    # Name of the Celery Task
    task_name: str

    # datetime the task was started at
    started_at: str


def get_tasks() -> List[GetTasksItem]:

    # Inspect all nodes.
    i = celery.control.inspect()

    # Show tasks that are currently active.
    active = i.active()

    celery_tasks = []
    for _, tasks in active.items():
        for task in tasks:
            try:
                celery_tasks.append(
                    GetTasksItem(
                        taskId=task["id"],
                        taskName=task["name"],
                        startedAt=task["time_start"],
                    )
                )

            except KeyError:
                continue

    return celery_tasks


def celery_tasks_prometheus_exporter():

    tasks = get_tasks()

    metric = PrometheusMetric(
        "celery_running_tasks",
        "The currently running celery tasks",
        labelnames=["task_name"],
        metric_type=PrometheusType.GAUGE,
    )

    for task in tasks:
        metric.save_time({"task_name": task["name"]}, start_time=task["time_start"])


PrometheusMetric.register_collector(
    "celery_tasks_prometheus_exporter", celery_tasks_prometheus_exporter
)
