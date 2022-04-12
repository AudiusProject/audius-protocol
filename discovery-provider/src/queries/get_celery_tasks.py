from typing import List, TypedDict

from src.tasks.celery import celery
from src.utils.prometheus_metric import PrometheusMetric, PrometheusType


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
                    {
                        "task_id": task["id"],
                        "task_name": task["name"],
                        "started_at": htask["time_start"],
                    }
                )

            except KeyError:
                continue

    return celery_tasks


def celery_tasks_prometheus_exporter():

    tasks = get_tasks()

    PrometheusMetric(
        "celery_running_tasks",
        "The currently running celery tasks",
        metric_type=PrometheusType.HISTOGRAM,
    ).save(tasks)


PrometheusMetric.register_collector(
    "celery_tasks_prometheus_exporter", celery_tasks_prometheus_exporter
)
