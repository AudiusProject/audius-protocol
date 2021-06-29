import json
import logging
from flask import current_app
from src.utils.redis_connection import get_redis
from src.challenges.profile_challenge import profile_challenge_manager
from src.challenges.challenge_event import ChallengeEvent

from collections import defaultdict

logger = logging.getLogger(__name__)
REDIS_QUEUE_PREFIX = 'challenges-event-queue'


class ChallengeEventBus:
    """`ChallengeEventBus` supports:
        - dispatching challenge events to a Redis queue
        - registering challenge managers to listen to the events.
        - consuming items from the Redis queue
    """
    def __init__(self, redis):
        self._listeners = defaultdict(lambda: [])
        self._redis = redis

    def register_listener(self, event, listener):
        """Registers a listener (`ChallengeEventManager`) to listen for a particular event type."""
        self._listeners[event].append(listener)

    def dispatch(self, session, event, block_number, user_id):
        """Dispatches an event + block_number + user_id to Redis queue"""
        try:
            event_json = self._event_to_json(event, block_number, user_id)
            logger.info(f"ChallengeEventBus: dispatch {event_json}")
            self._redis.rpush(REDIS_QUEUE_PREFIX, event_json)
        except Exception as e:
            logger.warning(f"ChallengeEventBus: error enqueuing to Redis: {e}")

    def process_events(self, session, max_events=1000):
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
            # map of {"event_type": [{ user_id: number, block_number: number }]}}
            event_user_dict = defaultdict(lambda: [])
            for event_dict in events_dicts:
                event_type = event_dict["event"]
                event_user_dict[event_type].append({
                    "user_id": event_dict["user_id"],
                    "block_number": event_dict["block_number"]
                })

            for (event_type, event_dicts) in event_user_dict.items():
                listeners = self._listeners[event_type]
                for listener in listeners:
                    listener.process(session, event_type, event_dicts)

            return len(events_json)
        except Exception as e:
            logger.warning(f"ChallengeEventBus: error processing from Redis: {e}")
            return 0
    # Helpers

    def _event_to_json(self, event, block_number, user_id):
        event_dict = {
            "event": event,
            "user_id": user_id,
            "block_number": block_number
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

    return bus
