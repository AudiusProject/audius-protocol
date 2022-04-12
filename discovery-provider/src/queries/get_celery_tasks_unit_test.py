from src.queries.get_celery_tasks import get_tasks


def test_get_tasks():

    # TODO : Mock Celery

    tasks = get_tasks()

    assert len(tasks) == 0
    assert tasks == []
