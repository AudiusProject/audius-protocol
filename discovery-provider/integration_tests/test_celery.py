import threading

from celery.worker import WorkController


def test_celery(celery_app):
    """Ensures that celery is able to start cleanly with provided configs"""
    worker = WorkController(app=celery_app.celery)
    thread = threading.Thread(target=worker.start)
    thread.daemon = True
    thread.start()
