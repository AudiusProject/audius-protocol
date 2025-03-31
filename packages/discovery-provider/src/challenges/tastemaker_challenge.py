import logging
from typing import Dict

from sqlalchemy.orm.session import Session

from src.challenges.challenge import ChallengeManager, ChallengeUpdater
from src.models.core.core_indexed_blocks import CoreIndexedBlocks
from src.utils.config import shared_config

logger = logging.getLogger(__name__)

# Targeting 2025-04-02
TASTEMAKER_CHALLENGE_START_BLOCK_PROD = 1120000
# Targeting 2025-03-25
TASTEMAKER_CHALLENGE_START_BLOCK_STAGE = 1000000
TASTEMAKER_CHALLENGE_START_BLOCK_DEV = 0


TASTEMAKER_CHALLENGE_START_CHAIN_ID_PROD = "audius-mainnet-alpha-beta"
TASTEMAKER_CHALLENGE_START_CHAIN_ID_STAGE = "audius-testnet-alpha"
TASTEMAKER_CHALLENGE_START_CHAIN_ID_DEV = "audius-devnet"


def get_tastemaker_challenge_start_block() -> int:
    env = shared_config["discprov"]["env"]
    if env == "dev":
        return TASTEMAKER_CHALLENGE_START_BLOCK_DEV
    if env == "stage":
        return TASTEMAKER_CHALLENGE_START_BLOCK_STAGE
    return TASTEMAKER_CHALLENGE_START_BLOCK_PROD


def get_tastemaker_challenge_start_chain_id() -> str:
    env = shared_config["discprov"]["env"]
    if env == "dev":
        return TASTEMAKER_CHALLENGE_START_CHAIN_ID_DEV
    if env == "stage":
        return TASTEMAKER_CHALLENGE_START_CHAIN_ID_STAGE
    return TASTEMAKER_CHALLENGE_START_CHAIN_ID_PROD


class TastemakerChallengeUpdater(ChallengeUpdater):
    """Tastemaker challenge

    This challenge is completed when a user reposts or saves a track that later lands in the top 5 trending tracks.
    """

    def generate_specifier(self, session: Session, user_id: int, extra: Dict) -> str:
        """
        Generate a specifier for the challenge based on user_id and tastemaker_item_id
        Format: {user_id}:{tastemaker_item_type}:{tastemaker_item_id}
        """
        item_type = "p" if extra["tastemaker_item_type"] == "playlist" else "t"
        return f"{hex(user_id)[2:]}:{item_type}:{hex(extra['tastemaker_item_id'])[2:]}"

    def should_create_new_challenge(
        self, session: Session, event: str, user_id: int, extra: Dict
    ) -> bool:
        block = (
            session.query(CoreIndexedBlocks)
            .filter(
                CoreIndexedBlocks.chain_id == get_tastemaker_challenge_start_chain_id()
            )
            .order_by(CoreIndexedBlocks.height.desc())
            .first()
        )
        if not block or not block.height:
            return False
        return block.height > get_tastemaker_challenge_start_block()


tastemaker_challenge_manager = ChallengeManager("t", TastemakerChallengeUpdater())
