import json
from typing import TypedDict

from celery.app.control import Inspect

from src.tasks.celery_app import celery


class GetTasksItem(TypedDict):
    # Id of the Celery Task
    task_id: str

    # Name of the Celery Task
    task_name: str

    # datetime the task was started at
    started_at: str


def get_celery_tasks(**kwargs) -> str:
    """
    Gets the running celery tasks
    """

    celery_app = celery

    # Inspect all nodes.
    i: Inspect = celery_app.control.inspect()

    active = i.active()
    registered = i.registered()

    if active is None:
        return json.dumps([])

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

    registered_celery_tasks = []
    for _, tasks in registered.items():
        for task in tasks:
            try:
                registered_celery_tasks.append(
                    GetTasksItem(
                        task_id="",
                        task_name=task,
                        started_at="",
                    )
                )

            except KeyError:
                continue

    ret = {
        "active_tasks": celery_tasks,
        "registered_celery_tasks": registered_celery_tasks,
    }
    return json.dumps(ret)
