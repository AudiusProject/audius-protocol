from typing import Dict, List, Optional, TypedDict

from src.challenges.challenge_event_bus import ChallengeEventBus


class ChallengeEventQueueItem(TypedDict):
    event: str
    block_number: int
    user_id: int
    extra: Optional[Dict]


class ChallengeEventQueue:
    _event_queue: List[ChallengeEventQueueItem] = []

    def __init__(self, bus: ChallengeEventBus):
        self._bus = bus

    def __enter__(self):
        self._event_queue = []
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.flush()

    def enqueue(
        self,
        event: str,
        block_number: int,
        user_id: int,
        extra: Dict = None,
    ):
        """Queues dispatching an event + block_number + user_id to Redis queue"""
        self._event_queue.append(
            {
                "event": event,
                "block_number": block_number,
                "user_id": user_id,
                "extra": extra,
            }
        )

    def flush(self):
        """ "Dispatches all the events in the queue to Redis and clears the in-memory queue"""
        for event in self._event_queue:
            self._bus.dispatch(
                event["event"],
                event["block_number"],
                event["user_id"],
                event["extra"] if event["extra"] else {},
            )
        self._event_queue.clear()
