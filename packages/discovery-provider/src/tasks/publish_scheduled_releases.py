from sqlalchemy import func
from sqlalchemy.orm.session import Session

from src.models.events.event import Event, EventType
from src.models.notifications.notification import Notification
from src.models.playlists.playlist import Playlist
from src.models.social.follow import Follow
from src.models.social.save import Save
from src.models.tracks.track import Track
from src.tasks.celery_app import celery
from src.tasks.entity_manager.entities.track import create_remix_contest_notification
from src.tasks.entity_manager.utils import safe_add_notification
from src.utils.structured_logger import StructuredLogger, log_duration
from src.utils.web3_provider import get_eth_web3

logger = StructuredLogger(__name__)
web3 = get_eth_web3()
publish_scheduled_releases_cursor_key = "publish_scheduled_releases_cursor"
batch_size = 100


def create_remix_contest_notification(session: Session, track: Track):
    """Create notifications for followers and favoriters when a track with a remix contest becomes public"""
    # Check if this track has an active remix contest event
    remix_contest_event = (
        session.query(Event)
        .filter(
            Event.event_type == EventType.remix_contest,
            Event.entity_id == track.track_id,
            Event.is_deleted == False,
        )
        .first()
    )

    if not remix_contest_event:
        return

    # Get all followers of the event creator
    follower_user_ids = (
        session.query(Follow.follower_user_id)
        .filter(
            Follow.followee_user_id == remix_contest_event.user_id,
            Follow.is_current == True,
            Follow.is_delete == False,
        )
        .all()
    )

    # Get all users who favorited the track
    save_user_ids = (
        session.query(Save.user_id)
        .filter(
            Save.save_item_id == track.track_id,
            Save.save_type == "track",
            Save.is_current == True,
            Save.is_delete == False,
        )
        .all()
    )

    # Combine and deduplicate user IDs
    user_ids = list(
        set(
            [user_id for (user_id,) in follower_user_ids]
            + [user_id for (user_id,) in save_user_ids]
        )
    )

    if not user_ids:
        return

    # Create individual notification for each user
    for user_id in user_ids:
        notification = Notification(
            blocknumber=track.blocknumber,
            user_ids=[user_id],
            timestamp=track.updated_at,
            type="fan_remix_contest_started",
            specifier=str(user_id),
            group_id=f"fan_remix_contest_started:{track.track_id}:user:{remix_contest_event.user_id}:blocknumber:{track.blocknumber}",
            data={
                "entity_user_id": track.owner_id,
                "entity_id": track.track_id,
            },
        )
        session.add(notification)


@log_duration(logger)
def _publish_scheduled_releases(session):
    tracks_to_release = (
        session.query(Track)
        .filter(
            Track.is_unlisted == True,
            Track.is_scheduled_release == True,
            Track.release_date != None,  # Filter for non-null release_date
            Track.release_date < func.current_timestamp(),
        )
        .order_by(Track.created_at.asc())
        .limit(batch_size)
        .all()
    )
    if len(tracks_to_release) == 0:
        return

    logger.info(f"Found {len(tracks_to_release)} tracks ready for release")

    for track in tracks_to_release:
        logger.debug(f"Releasing track {track.track_id}")
        track.is_unlisted = False
        create_remix_contest_notification(session, track)

    playlists_to_release = (
        session.query(Playlist)
        .filter(
            Playlist.is_private == True,
            Playlist.is_album == True,  # Only support albums for now
            Playlist.is_scheduled_release == True,
            Playlist.release_date != None,  # Filter for non-null release_date
            Playlist.release_date < func.current_timestamp(),
        )
        .order_by(Playlist.created_at.asc())
        .limit(batch_size)
        .all()
    )
    logger.debug(f"Found {len(playlists_to_release)} albums ready for release")

    for playlist in playlists_to_release:
        logger.debug(f"Releasing album {playlist.playlist_id}")
        playlist.is_private = False


# ####### CELERY TASKS ####### #
@celery.task(name="publish_scheduled_releases", bind=True)
def publish_scheduled_releases(self):
    redis = publish_scheduled_releases.redis
    db = publish_scheduled_releases.db

    # Define lock acquired boolean
    have_lock = False
    # Define redis lock object
    update_lock = redis.lock(
        "publish_scheduled_releases_lock", blocking_timeout=25, timeout=600
    )
    try:
        have_lock = update_lock.acquire(blocking=False)
        if have_lock:
            with db.scoped_session() as session:
                _publish_scheduled_releases(session)

        else:
            logger.debug("Failed to acquire lock")
    except Exception as e:
        logger.error(f"ERROR caching node info {e}")
        raise e
    finally:
        if have_lock:
            update_lock.release()
