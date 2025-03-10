from src.challenges.challenge import ChallengeManager
from src.challenges.play_count_milestone_challenge_base import (
    PlayCountMilestoneUpdaterBase,
)
from src.utils.config import shared_config

env = shared_config["discprov"]["env"]

# Milestone for this challenge
MILESTONE = 10000
REWARD_AMOUNT = 1000

# For testing environments, use smaller numbers
if env == "stage" or env == "dev":
    MILESTONE = 3


class PlayCount10000MilestoneUpdater(PlayCountMilestoneUpdaterBase):
    """
    Challenge to reward users for achieving 10000 plays in 2025.
    Rewards 1000 AUDIO upon completion.
    """

    MILESTONE = MILESTONE
    REWARD_AMOUNT = REWARD_AMOUNT
    CHALLENGE_ID = "p3"
    PREVIOUS_MILESTONE_CHALLENGE_ID = "p2"  # Previous milestone is 1000 plays


play_count_10000_milestone_challenge_manager = ChallengeManager(
    "p3", PlayCount10000MilestoneUpdater()
)
