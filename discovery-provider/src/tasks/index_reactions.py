import logging
import operator as op
from datetime import datetime
from typing import List, TypedDict, Union, cast

import requests
from redis import Redis
from sqlalchemy.orm.session import Session
from src.models.social.reaction import Reaction
from src.tasks.aggregates import init_task_and_acquire_lock
from src.tasks.celery_app import celery
from src.utils.config import shared_config
from src.utils.redis_constants import (
    LAST_REACTIONS_INDEX_TIME_KEY,
    LAST_SEEN_NEW_REACTION_TIME_KEY,
)
from src.utils.session_manager import SessionManager
from src.utils.update_indexing_checkpoints import (
    get_last_indexed_checkpoint,
    save_indexed_checkpoint,
)

logger = logging.getLogger(__name__)

# Constants

IDENTITY_INDEXING_CHECKPOINT_NAME = "identity_reactions_checkpoints"
IDENTITY_GET_REACTIONS_ENDPOINT = (
    f"{shared_config['discprov']['identity_service_url']}/reactions"
)
INDEX_REACTIONS_LOCK = "index_reactions_lock"

# Types


class ReactionResponse(TypedDict):
    id: int
    slot: int
    reactionValue: int
    senderWallet: str
    reactedTo: str
    reactionType: str
    createdAt: str
    updatedAt: str


def reaction_dict_to_model(reaction: ReactionResponse) -> Union[Reaction, None]:
    """Convert and sanitize the reaction model"""

    try:
        reaction_model = Reaction(
            slot=reaction["slot"],
            reaction_value=reaction["reactionValue"],
            sender_wallet=reaction["senderWallet"],
            reaction_type=reaction["reactionType"],
            reacted_to=reaction["reactedTo"],
            timestamp=cast(datetime, reaction["createdAt"]),
            tx_signature=None,  # no tx_signature for now
        )
        return reaction_model
    except Exception as e:
        logger.error(f"Got error trying to create reaction model: {e}")
        return None


def fetch_reactions_from_identity(start_index) -> List[ReactionResponse]:
    get_reactions_endpoint = (
        f"{IDENTITY_GET_REACTIONS_ENDPOINT}?startIndex={start_index}"
    )
    new_reactions_response = requests.get(get_reactions_endpoint, timeout=10)
    new_reactions_response.raise_for_status()
    return new_reactions_response.json()["reactions"]


def index_identity_reactions(session: Session, redis: Redis):
    try:
        last_checkpoint = get_last_indexed_checkpoint(
            session, IDENTITY_INDEXING_CHECKPOINT_NAME
        )

        new_reactions: List[ReactionResponse] = fetch_reactions_from_identity(
            last_checkpoint
        )
        redis.set(LAST_REACTIONS_INDEX_TIME_KEY, int(datetime.now().timestamp()))

        if not len(new_reactions):
            return

        # Map the reaction dicts to models, filtering out those that are invalid
        reaction_models = list(filter(None, map(reaction_dict_to_model, new_reactions)))

        session.bulk_save_objects(reaction_models)

        new_checkpoint = max(map(op.itemgetter("id"), new_reactions)) + 1
        save_indexed_checkpoint(
            session, IDENTITY_INDEXING_CHECKPOINT_NAME, new_checkpoint
        )
        logger.info(
            f"Indexed {len(reaction_models)} reactions, new checkpoint: {new_checkpoint}"
        )
        redis.set(LAST_SEEN_NEW_REACTION_TIME_KEY, int(datetime.now().timestamp()))
    except Exception as e:
        logger.error(f"index_reactions: error {e}")


@celery.task(name="index_reactions", bind=True)
def index_reactions(self):
    db: SessionManager = index_reactions.db
    redis: Redis = index_reactions.redis
    init_task_and_acquire_lock(
        logger,
        db,
        redis,
        None,
        index_identity_reactions,
        60 * 10,
        None,
        INDEX_REACTIONS_LOCK,
    )
