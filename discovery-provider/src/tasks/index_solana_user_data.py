from src.tasks.celery_app import celery
from src.utils.prometheus_metric import save_duration_metric


# Task simply calls into indexer class
@celery.task(name="index_solana_user_data", bind=True)
@save_duration_metric(metric_group="celery_task")
def index_solana_user_data(self):
    anchor_program_indexer = index_solana_user_data.anchor_program_indexer
    anchor_program_indexer.run()
