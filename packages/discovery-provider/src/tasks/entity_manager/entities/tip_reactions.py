from src.exceptions import IndexingValidationError
from src.models.social.reaction import Reaction
from src.queries.get_tips import GetTipsArgs, get_tips
from src.tasks.entity_manager.utils import Action, EntityType, ManageEntityParameters
from src.utils.structured_logger import StructuredLogger

logger = StructuredLogger(__name__)


# validates a valid tip reaction based on the manage entity parameters
# returns a valid reaction model
def validate_tip_reaction(params: ManageEntityParameters):
    if params.entity_type != EntityType.TIP:
        raise IndexingValidationError(f"Entity type {params.entity_type} is not a tip")
    if params.action != Action.REACTION:
        raise IndexingValidationError("Expected action to be reaction")

    if not params.metadata:
        raise IndexingValidationError("Metadata is required for tip reaction")

    metadata = params.metadata

    if metadata.get("reactedTo") is None:
        raise IndexingValidationError("reactedTo is required in tip reactions metadata")

    if metadata.get("reactionValue") is None:
        raise IndexingValidationError(
            "reactionValue is required in tip reactions metadata"
        )


def tip_reaction(params: ManageEntityParameters):
    try:
        validate_tip_reaction(params)

        metadata = params.metadata

        # pull relevant fields out of em metadata
        reacted_to = metadata.get("reactedTo")
        reaction_value = metadata.get("reactionValue")

        logger.info(f"Creating reaction {reaction_value} for reactedTo: {reacted_to}")

        tips_args = GetTipsArgs(tx_signatures=[reacted_to])
        tips = get_tips(tips_args)
        if not tips:
            raise IndexingValidationError(f"tip for {reacted_to} not found")
        tip = tips[0]

        # query solana for remaining info
        slot = tip.get("slot")
        sender_wallet = tip.get("sender")
        reaction_type = "tip"

        reaction = Reaction(
            reacted_to=reacted_to,
            reaction_value=reaction_value,
            slot=slot,
            sender_wallet=sender_wallet,
            reaction_type=reaction_type,
        )

        session = params.session
        session.bulk_save_objects([reaction])
    except Exception as e:
        logger.error(
            f"tip_reactions.py | error indexing tip reaction {params.metadata} {e}"
        )
        raise e
