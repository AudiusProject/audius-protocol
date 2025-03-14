from src.challenges.challenge import ChallengeManager
from src.challenges.play_count_milestone_challenge_base import (
    PlayCountMilestoneUpdaterBase,
)
from src.utils.config import shared_config

env = shared_config["discprov"]["env"]

# Reward amount for this challenge
REWARD_AMOUNT = 25


class PlayCount250MilestoneUpdater(PlayCountMilestoneUpdaterBase):
    """
    Challenge to reward users for achieving 250 plays in 2025.
    Rewards 25 AUDIO upon completion.
    """

    REWARD_AMOUNT = REWARD_AMOUNT
    CHALLENGE_ID = "p1"
    PREVIOUS_MILESTONE_CHALLENGE_ID = ""  # First milestone, no previous one


play_count_250_milestone_challenge_manager = ChallengeManager(
    "p1", PlayCount250MilestoneUpdater()
)
