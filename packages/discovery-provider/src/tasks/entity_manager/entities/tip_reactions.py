import logging
from datetime import datetime

from src.exceptions import IndexingValidationError
from src.models.social.reaction import Reaction
from src.models.users.user import User
from src.models.users.user_tip import UserTip
from src.tasks.entity_manager.utils import Action, EntityType, ManageEntityParameters

logger = logging.getLogger(__name__)


# validates a valid tip reaction based on the manage entity parameters
# returns a valid reaction model
def validate_tip_reaction(params: ManageEntityParameters):
    if params.entity_type != EntityType.TIP:
        raise IndexingValidationError(
            f"tip_reactions.py | Entity type {params.entity_type} is not a tip"
        )
    if params.action != Action.UPDATE:
        raise IndexingValidationError("tip_reactions.py | Expected action to be update")

    if not params.metadata:
        raise IndexingValidationError(
            "tip_reactions.py | Metadata is required for tip reaction"
        )

    metadata = params.metadata

    if metadata.get("reacted_to") is None:
        raise IndexingValidationError(
            "tip_reactions.py | reactedTo is required in tip reactions metadata"
        )

    reaction_value = metadata.get("reaction_value")
    if reaction_value is None:
        raise IndexingValidationError(
            "tip_reactions.py | reactionValue is required in tip reactions metadata"
        )

    if not 1 <= reaction_value <= 4:
        raise IndexingValidationError(
            f"rtip_reactions.py | eaction value out of range {metadata}"
        )


def tip_reaction(params: ManageEntityParameters):
    logger.debug("tip_reactions.py | indexing tip reaction")
    try:
        validate_tip_reaction(params)

        metadata = params.metadata

        # pull relevant fields out of em metadata
        reacted_to = metadata.get("reacted_to")
        reaction_value = metadata.get("reaction_value")

        reactor_user_id = params.user_id

        session = params.session
        sender_user_id = (
            session.query(UserTip.sender_user_id)
            .filter(
                UserTip.signature == reacted_to,
                UserTip.receiver_user_id == reactor_user_id,
            )
            .one_or_none()
        )

        sender = (
            session.query(User).filter(User.user_id == sender_user_id).one_or_none()
        )

        if not sender:
            raise IndexingValidationError(
                f"tip_reactions.py | sender on tip {reacted_to} was not found"
            )

        sender_wallet = sender.wallet
        if not sender_wallet:
            raise IndexingValidationError(
                f"tip_reactions.py | sender wallet not available {sender} {metadata}"
            )
        reaction_type = "tip"

        reaction = Reaction(
            reacted_to=reacted_to,
            reaction_value=reaction_value,
            sender_wallet=sender_wallet,
            reaction_type=reaction_type,
            timestamp=datetime.now(),
            blocknumber=params.block_number,
        )

        params.add_record(reacted_to, reaction)
    except Exception as e:
        logger.error(f"tip_reactions.py | error indexing tip reactions {e}")
