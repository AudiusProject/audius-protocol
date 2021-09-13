import logging
from typing import List, Optional, Tuple, Dict
from datetime import date, datetime, timedelta
from sqlalchemy.orm.session import Session
from sqlalchemy import desc
import pytz

from src.challenges.challenge import (
    ChallengeManager,
    ChallengeUpdater,
    FullEventMetadata,
)
from src.models.models import UserChallenge
from src.models.trending_result import TrendingResult

logger = logging.getLogger(__name__)


class TrendingChallengeUpdater(ChallengeUpdater):
    """Updates the trending track challenge."""

    def update_user_challenges(
        self,
        session: Session,
        event: str,
        user_challenges: List[UserChallenge],
        step_count: Optional[int],
        event_metadatas: List[FullEventMetadata],
        starting_block: Optional[int],
    ):
        # Update the user_challenges
        for user_challenge in user_challenges:
            # Update completion
            user_challenge.is_complete = True

    def on_after_challenge_creation(self, session, metadatas: List[FullEventMetadata]):
        trending_results = [
            TrendingResult(
                user_id=metadata["extra"]["user_id"],
                id=metadata["extra"]["id"],
                rank=metadata["extra"]["rank"],
                type=metadata["extra"]["type"],
                version=metadata["extra"]["version"],
                week=metadata["extra"]["week"],
            )
            for metadata in metadatas
        ]
        session.add_all(trending_results)

    def generate_specifier(self, user_id: int, extra: Dict) -> str:
        return f"{extra['rank']}"


trending_track_challenge_manager = ChallengeManager(
    "trending-track", TrendingChallengeUpdater()
)

trending_underground_track_challenge_manager = ChallengeManager(
    "trending-underground-track", TrendingChallengeUpdater()
)

trending_playlist_challenge_manager = ChallengeManager(
    "trending-playlist", TrendingChallengeUpdater()
)


def is_dst(zonename):
    """Checks if is daylight savings time
    During daylight savings, the clock moves forward one hr
    """
    tz = pytz.timezone(zonename)
    now = pytz.utc.localize(datetime.utcnow())
    return now.astimezone(tz).dst() != timedelta(0)


def get_is_valid_timestamp(dt: datetime):

    isFriday = dt.weekday() == 4

    # Check timestamp to be between 12pm and 1pm PT
    add_hr = is_dst("America/Los_Angeles")
    min = 19 if add_hr else 20
    max = 20 if add_hr else 21

    isWithinHourMargin = dt.hour >= min and dt.hour < max

    return isFriday and isWithinHourMargin


def should_trending_challenge_update(
    session: Session, timestamp: int
) -> Tuple[bool, Optional[date]]:
    """Checks if the timestamp is after a week and there is no pending trending update
    Returns a tuple of boolean if the challenge should be updated, and if it's set to true, the date
    """

    dt = datetime.fromtimestamp(timestamp)
    is_valid_timestamp = get_is_valid_timestamp(dt)
    if not is_valid_timestamp:
        return (False, None)

    # DB query for most recent db row of trending's date
    # using that, figure out new date threshold -> next friday at noon
    most_recent_user_challenge = (
        session.query(TrendingResult.week).order_by(desc(TrendingResult.week)).first()
    )

    if most_recent_user_challenge is None:
        # do somthing
        return (True, dt.date())
    week = most_recent_user_challenge[0]

    if week == dt.date():
        return (False, None)

    return (True, dt.date())
