import json
import enum
from collections import defaultdict

REDIS_QUEUE_PREFIX = 'challenges-event-queue'

class ChallengeEvent(str, enum.Enum):
    profile_update = 'profile_update'
    repost = 'repost'
    follow = 'follow'
    favorite = 'favorite'

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
        event_json = self._event_to_json(event, block_number, user_id)
        self._redis.rpush(REDIS_QUEUE_PREFIX, event_json)

    def process_events(self, session, max_events=1000):
        """Dequeues `max_events` from Redis queue and processes them, forwarding to listening ChallengeManagers"""
        # get the first max_events elements
        events_json = self._redis.lrange(REDIS_QUEUE_PREFIX, 0, max_events)
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
