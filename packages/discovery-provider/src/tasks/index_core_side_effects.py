from logging import LoggerAdapter

from redis import Redis
from sqlalchemy.orm.session import Session
from web3 import Web3

from src.challenges.challenge_event_bus import ChallengeEventBus
from src.challenges.trending_challenge import should_trending_challenge_update
from src.tasks.calculate_trending_challenges import enqueue_trending_challenges
from src.tasks.celery_app import celery
from src.tasks.core.gen.protocol_pb2 import BlockResponse


def run_side_effects(
    logger: LoggerAdapter,
    block: BlockResponse,
    session: Session,
    web3: Web3,
    redis: Redis,
    challenge_bus: ChallengeEventBus,
):
    block_number = block.height
    # should be an int like before
    block_time = block.timestamp.seconds

    try:
        # Only dispatch trending challenge computation on a similar block, modulo 100
        # so things are consistent. Note that if a discovery node is behind, this will be
        # inconsistent.
        # TODO: Consider better alternatives for consistency with behind nodes. Maybe this
        # should not be calculated.
        if block_number % 100 == 0:
            # Check the last block's timestamp for updating the trending challenge
            [should_update, date] = should_trending_challenge_update(
                session, int(block_time)
            )
            if should_update and date is not None:
                enqueue_trending_challenges(session, web3, redis, challenge_bus, date)

    except Exception as e:
        # Do not throw error, as this should not stop indexing
        logger.error(
            f"Error in calling update trending challenge {e}",
            exc_info=True,
        )
    try:
        # Every 100 blocks, poll and apply delist statuses from trusted notifier
        if block_number % 100 == 0:
            celery.send_task(
                "update_delist_statuses",
                kwargs={"current_block_timestamp": block_time},
            )
    except Exception as e:
        # Do not throw error, as this should not stop indexing
        logger.error(
            f"Error in calling update_delist_statuses {e}",
            exc_info=True,
        )
