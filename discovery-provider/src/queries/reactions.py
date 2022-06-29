from typing import List, Optional, TypedDict

from sqlalchemy import desc
from sqlalchemy.orm.session import Session
from src.models.social.reaction import Reaction
from src.models.users.user import User


class ReactionResponse(TypedDict):
    reaction_value: int
    reaction_type: str
    reacted_to: str
    sender_user_id: int


def get_reactions(
    session: Session, reacted_to_ids: List[str], type: Optional[str]
) -> Optional[List[ReactionResponse]]:
    filters = [Reaction.reacted_to.in_(reacted_to_ids), User.is_current == True]
    if type:
        filters.append(Reaction.reaction_type == type)

    r: Reaction
    user_id: int
    result = (
        session.query(Reaction, User.user_id)
        .join(User, User.wallet == Reaction.sender_wallet)
        .filter(
            *filters,
        )
        .order_by(desc(Reaction.slot))
        .first()
    )

    if not result:
        return None

    r, user_id = result

    return [
        {
            "reaction_value": r.reaction_value,
            "reaction_type": r.reaction_type,
            "reacted_to": r.reacted_to,
            "sender_user_id": user_id,
        }
    ]
