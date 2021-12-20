from datetime import datetime

class ListenHistory:
    def __init__(self, track_id: int, timestamp: datetime):
        self.track_id = track_id
        self.timestamp = timestamp

    def to_dict(self):
        return {"track_id": self.track_id, "timestamp": str(self.timestamp)}
