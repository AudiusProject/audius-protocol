from src.tasks.entity_manager.entity_manager import entity_manager_update


def index_core_entity_manager(
    logger: logging.Logger,
    session: Session,
    challenge_bus: ChallengeEventBus,
    block: Block,
    block_number: int,
    block_timestamp: int,
    block_hash: str,
):
    entity_manager_update(
        logger, session, challenge_bus, block, block_number, block_timestamp, block_hash
    )
