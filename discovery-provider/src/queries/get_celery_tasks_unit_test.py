import pytest
from src.queries.get_celery_tasks import get_tasks


@pytest.fixture(scope='session')
def celery_config():
    return {
        'broker_url': 'memory://',
        'result_backend': 'rpc'
    }


@pytest.mark.celery_app
def test_get_tasks(celery_app):

    tasks = get_tasks(injected_app=celery_app)

    assert len(tasks) == 0
    assert tasks == []
