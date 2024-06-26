import json
import random
import re
from datetime import datetime
from typing import List, Optional

import requests
from redis import Redis
from sqlalchemy import or_
from sqlalchemy.orm.session import Session

from src.api_helpers import generate_signature
from src.models.tracks.track import Track
from src.tasks.celery_app import celery
from src.utils import get_all_nodes
from src.utils.prometheus_metric import save_duration_metric
from src.utils.structured_logger import StructuredLogger, log_duration

logger = StructuredLogger(__name__)

REPAIR_AUDIO_ANALYSES_LOCK = "repair_audio_analyses_lock"
DEFAULT_LOCK_TIMEOUT_SECONDS = 30 * 60  # 30 minutes
BATCH_SIZE = 1000


def query_tracks(session: Session) -> List[Track]:
    tracks = (
        session.query(Track)
        .filter(
            Track.is_current == True,
            or_(Track.musical_key == None, Track.bpm == None),
            Track.audio_analysis_error_count < 3,
            Track.track_cid != None,
            Track.genre != "Podcasts",
            Track.genre != "Podcast",
            Track.genre != "Audiobooks",
        )
        .order_by(Track.track_id.asc())
        .limit(BATCH_SIZE)
        .all()
    )
    return tracks


# Select 5 random healthy content nodes
def select_content_nodes(redis: Redis):
    content_nodes = get_all_nodes.get_all_healthy_content_nodes_cached(redis)
    endpoints = [re.sub("/$", "", node["endpoint"].lower()) for node in content_nodes]
    return random.sample(endpoints, min(5, len(endpoints)))


def retrigger_audio_analysis(
    nodes: List[str],
    track_id: int,
    track_cid: str,
    upload_id: Optional[str],
    legacy_track: bool,
):
    cid = ""
    if legacy_track:
        cid = track_cid
        upload_id = ""
    data = {
        "trackId": track_id,
        "cid": cid,
        "timestamp": int(datetime.utcnow().timestamp() * 1000),
        "upload_id": upload_id,
    }
    signature = generate_signature(data)
    params = {
        "signature": json.dumps(
            {
                "data": json.dumps(data),
                "signature": signature,
            }
        )
    }
    for node in nodes:
        try:
            endpoint = (
                f"{node}/tracks/legacy/{track_cid}/analyze"
                if legacy_track
                else f"{node}/uploads/{upload_id}/analyze"
            )
            resp = requests.post(endpoint, params=params, timeout=5)
            if resp.status_code == 400:
                # Should only return a 400 if content found the track_cid to not be an audio file, therefore unable to be analyzed.
                # Quit early because all CNs will 400 for this cid.
                logger.warning(
                    f"repair_audio_analyses.py | attempt to trigger audio analysis for track {track_id} (track_cid: {track_cid}, audio_upload_id: {upload_id}) failed with status code {resp.status_code}: {resp.text}"
                )
                return
            resp.raise_for_status()
            return
        except Exception:
            # Fallback to the next node
            continue
    logger.warning(
        f"repair_audio_analyses.py | failed to trigger audio analysis for track {track_id} (track_cid: {track_cid}, audio_upload_id: {upload_id}). tried {nodes}"
    )


def repair(session: Session, redis: Redis):
    # Query batch of tracks that are missing key or bpm and have err counts < 3 from db
    tracks = query_tracks(session)
    nodes = select_content_nodes(redis)
    num_tracks_updated = 0
    num_analyses_retriggered = 0
    for track in tracks:
        if not track.track_cid:
            # Only analyze streamable tracks
            continue
        legacy_track = not track.audio_upload_id
        found = False
        for node in nodes:
            try:
                # Query random content node for the audio upload id
                endpoint = (
                    f"{node}/tracks/legacy/{track.track_cid}/analysis"
                    if legacy_track
                    else f"{node}/uploads/{track.audio_upload_id}"
                )
                resp = requests.get(endpoint, timeout=5)
                if resp.status_code == 404 and not legacy_track:
                    # Use legacy path for upload ids that are not found
                    # (I think there are some edge cases from early storage v2 migration days)
                    legacy_track = True
                resp.raise_for_status()
                data = resp.json()
            except Exception:
                # Fallback to another random content node
                continue

            results_key = "results" if legacy_track else "audio_analysis_results"
            error_count_key = (
                "error_count" if legacy_track else "audio_analysis_error_count"
            )
            results = data.get(results_key, {})
            if not results:
                results = {}
            error_count = data.get(error_count_key, 0)
            key = results.get("key", None) or results.get("Key", None)
            bpm = results.get("bpm", None) or results.get("BPM", None)

            # Populate analysis results and err count if present
            if (
                key != track.musical_key
                or bpm != track.bpm
                or error_count != track.audio_analysis_error_count
            ):
                num_tracks_updated += 1
            if key:
                track.musical_key = key
            if bpm:
                track.bpm = bpm
            track.audio_analysis_error_count = error_count

            # Failures get retried up to 3 times
            if (not key or not bpm) and error_count < 3:
                # Trigger another audio analysis but don't bother polling for result. Will read it in next batch.
                num_analyses_retriggered += 1
                retrigger_audio_analysis(
                    nodes,
                    track.track_id,
                    track.track_cid,
                    track.audio_upload_id,
                    legacy_track,
                )
            if error_count >= 3:
                logger.warning(
                    f"repair_audio_analyses.py | Track ID {track.track_id} (track_cid: {track.track_cid}, audio_upload_id: {track.audio_upload_id}) failed audio analysis >= 3 times"
                )
            found = True
            break

        if not found:
            logger.warning(
                f"repair_audio_analyses.py | failed to query audio analysis for track {track.track_id} (track_cid: {track.track_cid}, audio_upload_id: {track.audio_upload_id}). tried {nodes}. triggering analysis..."
            )
            num_analyses_retriggered += 1
            retrigger_audio_analysis(
                nodes,
                track.track_id,
                track.track_cid,
                track.audio_upload_id,
                legacy_track,
            )

    logger.info(
        f"repair_audio_analyses.py | updated {num_tracks_updated} tracks, retriggered analyses for {num_analyses_retriggered} tracks. last track ID processed: {tracks[-1].track_id}"
    )


@celery.task(name="repair_audio_analyses", bind=True)
@save_duration_metric(metric_group="celery_task")
@log_duration(logger)
def repair_audio_analyses(self) -> None:
    """Recurring task that repairs missing track audio analyses"""

    db = repair_audio_analyses.db
    redis = repair_audio_analyses.redis

    have_lock = False
    update_lock = redis.lock(
        REPAIR_AUDIO_ANALYSES_LOCK,
        timeout=DEFAULT_LOCK_TIMEOUT_SECONDS,
    )

    have_lock = update_lock.acquire(blocking=False)
    if have_lock:
        try:
            with db.scoped_session() as session:
                repair(session, redis)
        except Exception as e:
            logger.error(
                "repair_audio_analyses.py | Fatal error in main loop", exc_info=True
            )
            raise e
        finally:
            if have_lock:
                try:
                    update_lock.release()
                except Exception as e:
                    logger.warning(
                        f"repair_audio_analyses.py | Error releasing lock: {e}"
                    )
    else:
        logger.warning(
            "repair_audio_analyses.py | Lock not acquired",
            exc_info=True,
        )
