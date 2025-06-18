from datetime import datetime, timedelta

from src.models.events.event import Event, EventType
from src.models.notifications.notification import Notification
from src.models.tracks.track import Track
from src.utils.structured_logger import StructuredLogger

FAN_REMIX_CONTEST_ENDED = "fan_remix_contest_ended"
REMIX_CONTEST_ENDED_WINDOW_HOURS = 24

logger = StructuredLogger(__name__)


def get_fan_remix_contest_ended_group_id(event_id):
    return f"{FAN_REMIX_CONTEST_ENDED}:{event_id}"


def create_fan_remix_contest_ended_notifications(session, now=None):
    now = now or datetime.now()
    window_start = now - timedelta(hours=REMIX_CONTEST_ENDED_WINDOW_HOURS)
    window_end = now

    ended_contests = (
        session.query(Event)
        .filter(
            Event.event_type == EventType.remix_contest,
            Event.is_deleted == False,
            Event.end_date != None,
            Event.end_date.between(window_start, window_end),
        )
        .all()
    )

    new_notifications = []
    for event in ended_contests:
        contest_track_id = event.entity_id
        remixers = (
            session.query(Track.owner_id)
            .filter(
                Track.is_current == True,
                Track.is_delete == False,
                Track.remix_of != None,
                Track.remix_of["tracks"].contains(
                    [{"parent_track_id": contest_track_id}]
                ),
            )
            .all()
        )
        remixer_user_ids = {row[0] for row in remixers}
        for user_id in remixer_user_ids:
            group_id = get_fan_remix_contest_ended_group_id(event.event_id)
            parent_track = (
                session.query(Track)
                .filter(
                    Track.track_id == event.entity_id,
                    Track.is_current == True,
                    Track.is_delete == False,
                )
                .first()
            )
            parent_track_owner_id = parent_track.owner_id if parent_track else None

            # Don't create notifications for private tracks
            if parent_track.is_unlisted and parent_track_owner_id is not None:
                continue

            exists = (
                session.query(Notification)
                .filter(
                    Notification.group_id == group_id,
                    Notification.type == FAN_REMIX_CONTEST_ENDED,
                    Notification.user_ids.any(user_id),
                )
                .first()
            )
            if not exists:
                new_notification = Notification(
                    specifier=str(user_id),
                    group_id=group_id,
                    blocknumber=None,
                    user_ids=[user_id],
                    type=FAN_REMIX_CONTEST_ENDED,
                    data={
                        "entity_id": event.entity_id,
                        "entity_user_id": parent_track_owner_id,
                    },
                    timestamp=now,
                )
                new_notifications.append(new_notification)
    logger.info(
        f"Inserting {len(new_notifications)} fan remix contest ended notifications"
    )
    session.add_all(new_notifications)
    session.commit()
