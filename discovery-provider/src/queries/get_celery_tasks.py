
from typing import List, TypedDict

from src.tasks.celery import celery
from src.utils.prometheus_metric import PrometheusMetric, PrometheusType


class GetTasksItem(TypedDict):

    # Id of the Celery Task
    taskId: str

    # Name of the Celery Task
    taskName: str

    # datetime the task was started at
    startedAt: str


def get_tasks() -> List[GetTasksItem]:

    celery_tasks: List[GetTasksItem] = []

    # Inspect all nodes.
    i = celery.control.inspect()

    # Show tasks that are currently active.
    active = i.active()
    activeItems = []
    for worker in active.keys():
        for task in active[worker]:
            activeItems.append(
                GetTasksItem(
                    taskId=task["id"], 
                    taskName=task["name"], 
                    startedAt=task["time_start"]
                )
            )

    celery_tasks += activeItems

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
