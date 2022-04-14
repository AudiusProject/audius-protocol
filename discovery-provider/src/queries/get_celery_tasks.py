from typing import List, TypedDict

from celery import Celery
from celery.app.control import Inspect
from src.tasks.celery_app import celery as celery_app
from src.utils.prometheus_metric import PrometheusMetric, PrometheusType


class GetTasksItem(TypedDict):

    # Id of the Celery Task
    task_id: str

    # Name of the Celery Task
    task_name: str

    # datetime the task was started at
    started_at: str


def get_tasks(injected_app: Celery = None) -> List[GetTasksItem]:

    app = injected_app if injected_app is not None else celery_app

    # Inspect all nodes.
    i: Inspect = app.control.inspect()

    print(i.__dict__)
    print(i.active)

    # Show tasks that are currently active.
    active = i.active()

    if active is None:
        return []

    celery_tasks = []
    for _, tasks in active.items():
        for task in tasks:
            try:
                celery_tasks.append(
                    GetTasksItem(
                        task_id=task["id"],
                        task_name=task["name"],
                        started_at=task["time_start"],
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
