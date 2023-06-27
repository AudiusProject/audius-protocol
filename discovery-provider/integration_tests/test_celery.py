import multiprocessing
import time

from celery.worker import WorkController


def test_celery(celery_app):
    """Ensures that celery is able to start cleanly with provided configs"""

    def target():
        worker = WorkController(app=celery_app.celery)
        worker.start()

    process = multiprocessing.Process(target=target)
    process.start()
    time.sleep(1)
    process.terminate()
