import json
from typing import Dict, List, TypedDict

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

    if active is None:
        return json.dumps({"THE_TASKS": []})

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

    return json.dumps(celery_tasks)
