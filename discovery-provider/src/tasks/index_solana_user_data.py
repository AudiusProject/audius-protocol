from src.tasks.celery_app import celery


# Task simply calls into indexer class
@celery.task(name="index_solana_user_data", bind=True)
def index_solana_user_data(self):
    anchor_program_indexer = index_solana_user_data.anchor_program_indexer
    anchor_program_indexer.run()
