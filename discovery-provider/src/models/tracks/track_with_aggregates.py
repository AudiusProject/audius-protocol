from sqlalchemy.orm import relationship
from src.models.social.aggregate_plays import AggregatePlay
from src.models.tracks.aggregate_track import AggregateTrack
from src.models.tracks.track import Track


class TrackWithAggregates(Track):
    aggregate_track = relationship(  # type: ignore
        AggregateTrack,
        primaryjoin="Track.track_id == foreign(AggregateTrack.track_id)",
        lazy="joined",
        viewonly=True,
    )

    aggregate_play = relationship(  # type: ignore
        AggregatePlay,
        primaryjoin="Track.track_id == foreign(AggregatePlay.play_item_id)",
        lazy="joined",
        viewonly=True,
    )
