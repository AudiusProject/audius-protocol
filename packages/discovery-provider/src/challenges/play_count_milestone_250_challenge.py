from src.challenges.challenge import ChallengeManager
from src.challenges.play_count_milestone_challenge_base import (
    PlayCountMilestoneUpdaterBase,
)
from src.utils.config import shared_config

env = shared_config["discprov"]["env"]

# Milestone for this challenge
MILESTONE = 250
REWARD_AMOUNT = 25

# For testing environments, use smaller numbers
if env == "stage" or env == "dev":
    MILESTONE = 1


class PlayCount250MilestoneUpdater(PlayCountMilestoneUpdaterBase):
    """
    Challenge to reward users for achieving 250 plays in 2025.
    Rewards 25 AUDIO upon completion.
    """

    MILESTONE = MILESTONE
    REWARD_AMOUNT = REWARD_AMOUNT
    CHALLENGE_ID = "p1"
    PREVIOUS_MILESTONE_CHALLENGE_ID = ""  # First milestone, no previous one


play_count_250_milestone_challenge_manager = ChallengeManager(
    "p1", PlayCount250MilestoneUpdater()
)
