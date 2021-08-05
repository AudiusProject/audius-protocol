import json
import logging
from flask import current_app
from src.challenges.challenge import ChallengeManager
from typing import Dict
from sqlalchemy.orm.session import Session
from src.utils.redis_connection import get_redis
from src.challenges.profile_challenge import profile_challenge_manager
from src.challenges.listen_streak_challenge import listen_streak_challenge_manager
from src.challenges.track_upload_challenge import track_upload_challenge_manager
from src.challenges.referral_challenge import (
    referral_challenge_manager,
    referred_challenge_manager,
)
from src.challenges.challenge_event import ChallengeEvent

from collections import defaultdict

logger = logging.getLogger(__name__)
REDIS_QUEUE_PREFIX = "challenges-event-queue"


class ChallengeEventBus:
    """`ChallengeEventBus` supports:
    - dispatching challenge events to a Redis queue
    - registering challenge managers to listen to the events.
    - consuming items from the Redis queue
    - fetching the manager for a given challenge
    """

    def __init__(self, redis):
        self._listeners = defaultdict(lambda: [])
        self._redis = redis
        self._managers = {}

    def register_listener(self, event: str, listener: ChallengeManager):
        """Registers a listener (`ChallengeManager`) to listen for a particular event type."""
        self._listeners[event].append(listener)
        if not listener.challenge_id in self._managers:
            self._managers[listener.challenge_id] = listener

    def get_manager(self, challenge_id: str) -> ChallengeManager:
        """Gets a manager for a given challenge_id"""
        return self._managers[challenge_id]

    def dispatch(
        self,
        session: Session,
        event: str,
        block_number: int,
        user_id: int,
        extra: Dict = {},
    ):
        """Dispatches an event + block_number + user_id to Redis queue"""
        try:
            event_json = self._event_to_json(event, block_number, user_id, extra)
            logger.info(f"ChallengeEventBus: dispatch {event_json}")
            self._redis.rpush(REDIS_QUEUE_PREFIX, event_json)
        except Exception as e:
            logger.warning(f"ChallengeEventBus: error enqueuing to Redis: {e}")

    def process_events(self, session: Session, max_events=1000):
        """Dequeues `max_events` from Redis queue and processes them, forwarding to listening ChallengeManagers.
        Returns the number of events it's processed.
        """
        try:
            # get the first max_events elements.
            events_json = self._redis.lrange(REDIS_QUEUE_PREFIX, 0, max_events)
            logger.info(f"ChallengeEventBus: dequeued {len(events_json)} events")
            # trim the first from the front of the list
            self._redis.ltrim(REDIS_QUEUE_PREFIX, len(events_json), -1)
            events_dicts = list(map(self._json_to_event, events_json))

            # Consolidate event types for processing
            # map of {"event_type": [{ user_id: number, block_number: number, extra: {} }]}}
            event_user_dict = defaultdict(lambda: [])
            for event_dict in events_dicts:
                event_type = event_dict["event"]
                event_user_dict[event_type].append(
                    {
                        "user_id": event_dict["user_id"],
                        "block_number": event_dict["block_number"],
                        "extra": event_dict.get(  # use .get to be safe since prior versions didn't have `extra`
                            "extra", {}
                        ),
                    }
                )

            for (event_type, event_dicts) in event_user_dict.items():
                listeners = self._listeners[event_type]
                for listener in listeners:
                    listener.process(session, event_type, event_dicts)

            return len(events_json)
        except Exception as e:
            logger.warning(f"ChallengeEventBus: error processing from Redis: {e}")
            return 0

    # Helpers

    def _event_to_json(self, event: str, block_number: int, user_id: int, extra: Dict):
        event_dict = {
            "event": event,
            "user_id": user_id,
            "block_number": block_number,
            "extra": extra,
        }
        return json.dumps(event_dict)

    def _json_to_event(self, event_json):
        return json.loads(event_json)


def setup_challenge_bus():
    redis = get_redis()
    bus = ChallengeEventBus(redis)

    # register listeners

    # profile_challenge_mananger listeners
    bus.register_listener(ChallengeEvent.profile_update, profile_challenge_manager)
    bus.register_listener(ChallengeEvent.repost, profile_challenge_manager)
    bus.register_listener(ChallengeEvent.follow, profile_challenge_manager)
    bus.register_listener(ChallengeEvent.favorite, profile_challenge_manager)
    # listen_streak_challenge_manager listeners
    bus.register_listener(ChallengeEvent.track_listen, listen_streak_challenge_manager)
    # track_upload_challenge_manager listeners
    bus.register_listener(ChallengeEvent.track_upload, track_upload_challenge_manager)
    bus.register_listener(ChallengeEvent.referral_signup, referral_challenge_manager)
    bus.register_listener(ChallengeEvent.referred_signup, referred_challenge_manager)

    return bus


def get_event_bus():
    return current_app.challenge_bus
