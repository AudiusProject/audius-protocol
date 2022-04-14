import pytest
from src.queries.get_celery_tasks import get_tasks


def test_no_tasks(celery_app):

    tasks = get_tasks(injected_app=celery_app)

    assert len(tasks) == 0
    assert tasks == []
