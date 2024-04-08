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
        raise IndexingValidationError(f"Entity type {params.entity_type} is not a tip")
    if params.action != Action.UPDATE:
        raise IndexingValidationError("Expected action to be update")

    if not params.metadata:
        raise IndexingValidationError("Metadata is required for tip reaction")

    metadata = params.metadata

    if metadata.get("reacted_to") is None:
        raise IndexingValidationError("reactedTo is required in tip reactions metadata")

    if metadata.get("reaction_value") is None:
        raise IndexingValidationError(
            "reactionValue is required in tip reactions metadata"
        )


def tip_reaction(params: ManageEntityParameters):
    try:
        validate_tip_reaction(params)

        metadata = params.metadata

        # pull relevant fields out of em metadata
        reacted_to = metadata.get("reacted_to")
        reaction_value = metadata.get("reaction_value")

        reactor_user_id = params.user_id

        session = params.session
        tip = (
            session.query(UserTip.slot, UserTip.sender_user_id)
            .filter(
                UserTip.signature == reacted_to,
                UserTip.receiver_user_id == reactor_user_id,
            )
            .one_or_none()
        )

        if not tip:
            raise IndexingValidationError(
                f"reactor {reactor_user_id} reacted to a tip {reacted_to} that doesn't exist"
            )

        slot, sender_user_id = tip

        sender_wallet = (
            session.query(User.wallet)
            .filter(User.user_id == sender_user_id)
            .one_or_none()
        )

        if not sender_wallet:
            raise IndexingValidationError(f"sender on tip {reacted_to} was not found")

        reaction_type = "tip"

        reaction = Reaction(
            reacted_to=reacted_to,
            reaction_value=reaction_value,
            slot=slot,
            sender_wallet=sender_wallet,
            reaction_type=reaction_type,
            timestamp=datetime.now(),
        )

        params.add_record(reacted_to, reaction)
    except Exception as e:
        logger.error(f"tip_reactions.py | error indexing tip reactions {e}")
