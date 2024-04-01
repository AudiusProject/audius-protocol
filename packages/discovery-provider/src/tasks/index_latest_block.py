from src.tasks.celery_app import celery
from src.utils import helpers, web3_provider
from src.utils.prometheus_metric import save_duration_metric
from src.utils.redis_constants import (
    latest_block_hash_redis_key,
    latest_block_redis_key,
)

web3 = web3_provider.get_web3()


def update_latest_block_redis(final_poa_block):
    latest_block_from_chain = web3.eth.get_block("latest", True)
    default_indexing_interval_seconds = int(
        update_task.shared_config["discprov"]["block_processing_interval_sec"]
    )
    redis = update_task.redis
    # these keys have a TTL which is the indexing interval
    redis.set(
        latest_block_redis_key,
        latest_block_from_chain.number + (final_poa_block or 0),
        ex=default_indexing_interval_seconds,
    )
    redis.set(
        latest_block_hash_redis_key,
        latest_block_from_chain.hash.hex(),
        ex=default_indexing_interval_seconds,
    )


@celery.task(name="index_latest_block", bind=True)
@save_duration_metric(metric_group="celery_task")
def update_task(self):
    final_poa_block = helpers.get_final_poa_block()
    update_latest_block_redis(final_poa_block)
