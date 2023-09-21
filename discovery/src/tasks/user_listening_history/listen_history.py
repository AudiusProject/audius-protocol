from datetime import datetime


class ListenHistory:
    def __init__(self, track_id: int, timestamp: datetime, play_count: int):
        self.track_id = track_id
        self.timestamp = timestamp
        self.play_count = play_count

    def to_dict(self):
        return {
            "track_id": self.track_id,
            "timestamp": str(self.timestamp),
            "play_count": self.play_count,
        }
