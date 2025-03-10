from src.challenges.challenge import ChallengeManager
from src.challenges.play_count_milestone_challenge_base import (
    PlayCountMilestoneUpdaterBase,
)
from src.utils.config import shared_config

env = shared_config["discprov"]["env"]

# Milestone for this challenge
MILESTONE = 1000
REWARD_AMOUNT = 100

# For testing environments, use smaller numbers
if env == "stage" or env == "dev":
    MILESTONE = 2


class PlayCount1000MilestoneUpdater(PlayCountMilestoneUpdaterBase):
    """
    Challenge to reward users for achieving 1000 plays in 2025.
    Rewards 100 AUDIO upon completion.
    """

    MILESTONE = MILESTONE
    REWARD_AMOUNT = REWARD_AMOUNT
    CHALLENGE_ID = "p2"
    PREVIOUS_MILESTONE_CHALLENGE_ID = "p1"  # Previous milestone is 250 plays


play_count_1000_milestone_challenge_manager = ChallengeManager(
    "p2", PlayCount1000MilestoneUpdater()
)
