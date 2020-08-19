import logging # pylint: disable=C0302
from urllib.parse import urljoin, unquote
import requests
from sqlalchemy import func, desc
from datetime import datetime, timedelta

from src import api_helpers
from src.models import Track, RepostType, Follow, SaveType, Play
from src.utils.config import shared_config
from src.queries import response_name_constants
from src.queries.query_helpers import \
    get_karma, get_repost_counts, get_save_counts, get_genre_list

logger = logging.getLogger(__name__)

trending_cache_hits_key = 'trending_cache_hits'
trending_cache_miss_key = 'trending_cache_miss'
trending_cache_total_key = 'trending_cache_total'

def get_listen_counts(db, time, genre, limit, offset):

    def with_time_filter(base_query, time):
        delta = None
        if not time:
            return base_query
        if time == "year":
            delta = timedelta(weeks=52)
        elif time == "month":
            delta = timedelta(days=30)
        elif time == "week":
            delta = timedelta(weeks=1)
        elif time == "day":
            delta = timedelta(days=1)
        else:
            logger.warning(f"Invalid time passed to get_listen_counts: {time}")
            return base_query
        return (base_query
            .filter(
                Play.created_at > datetime.now() - delta
            ))

    def with_genre_filter(base_query, genre):
        if not genre:
            return base_query
        return (base_query
            .join(Track, Track.track_id == Play.play_item_id)
            .filter(Track.genre == genre)
        )

    with db.scoped_session() as session:
        # Construct base query
        base_query = (
            session.query(Play.play_item_id, func.count(Play.id))
                .group_by(Play.play_item_id)
            )

        # Add time filter, if any
        base_query = with_time_filter(base_query, time)
        base_query = with_genre_filter(base_query, genre)

        # Add limit + offset + sort
        base_query = (base_query
                        .order_by(desc(func.count(Play.id)))
                        .limit(limit)
                        .offset(offset))
        listens = base_query.all()

        # Format the results
        listens = [{"trackId": listen[0], "listens": listen[1]} for listen in listens]
        return listens

def generate_trending(db, time, genre, limit, offset):
    listen_data = get_listen_counts(db, time, genre, limit, offset)
    logger.warning(listen_data)
    identity_url = shared_config['discprov']['identity_service_url']
    identity_trending_endpoint = urljoin(identity_url, f"/tracks/trending/{time}")

    post_body = {}
    post_body["limit"] = limit
    post_body["offset"] = offset

    # Retrieve genre and query all tracks if required
    if genre is not None:
        # Parse encoded characters, such as Hip-Hop%252FRap -> Hip-Hop/Rap
        genre = unquote(genre)
        with db.scoped_session() as session:
            genre_list = get_genre_list(genre)
            genre_track_ids = (
                session.query(Track.track_id)
                .filter(
                    Track.genre.in_(genre_list),
                    Track.is_current == True,
                    Track.is_delete == False,
                    Track.is_unlisted == False,
                    Track.stem_of == None
                )
                .all()
            )
            genre_specific_track_ids = [record[0] for record in genre_track_ids]
            post_body["track_ids"] = genre_specific_track_ids

    # Query trending information from identity service
    resp = None
    try:
        resp = requests.post(identity_trending_endpoint, json=post_body)
    except Exception as e: # pylint: disable=W0703
        logger.error(
            f'Error retrieving trending info - {identity_trending_endpoint}, {post_body}'
        )
        return api_helpers.error_response(e, 500)

    json_resp = resp.json()
    if "error" in json_resp:
        return api_helpers.error_response(json_resp["error"], 500)

    listen_counts = json_resp["listenCounts"]
    logger.warning(listen_counts)
    # Convert trackId to snakeCase
    for track_entry in listen_counts:
        track_entry[response_name_constants.track_id] = track_entry['trackId']
        del track_entry['trackId']

    track_ids = [track[response_name_constants.track_id] for track in listen_counts]

    with db.scoped_session() as session:
        # Filter tracks to not-deleted ones so trending order is preserved
        not_deleted_track_ids = (
            session.query(Track.track_id, Track.created_at)
            .filter(
                Track.track_id.in_(track_ids),
                Track.is_current == True,
                Track.is_delete == False,
                Track.is_unlisted == False,
                Track.stem_of == None
            )
            .all()
        )

        # Generate track -> created_at date
        track_created_at_dict = {
            record[0]: record[1] for record in not_deleted_track_ids
        }

        not_deleted_track_ids = set([record[0] for record in not_deleted_track_ids]) # pylint: disable=R1718
        # Query repost counts
        repost_counts = get_repost_counts(session, False, True, not_deleted_track_ids, None)
         # Generate track_id --> repost_count mapping
        track_repost_counts = {
            repost_item_id: repost_count
            for (repost_item_id, repost_count, repost_type) in repost_counts
            if repost_type == RepostType.track
        }

        # Query repost count with respect to rolling time frame in URL (e.g. /trending/week -> window = rolling week)
        track_repost_counts_for_time = \
            get_repost_counts(session, False, True, not_deleted_track_ids, None, None, time)
        # Generate track_id --> windowed_save_count mapping
        track_repost_counts_for_time = {
            repost_item_id: repost_count
            for (repost_item_id, repost_count, repost_type) in track_repost_counts_for_time
            if repost_type == RepostType.track
        }

        # Query follower info for each track owner
        # Query each track owner
        track_owners_query = (
            session.query(Track.track_id, Track.owner_id)
            .filter
            (
                Track.is_current == True,
                Track.is_unlisted == False,
                Track.stem_of == None,
                Track.track_id.in_(not_deleted_track_ids)
            )
            .all()
        )

        # Generate track_id <-> owner_id mapping
        track_owner_dict = {track_id: owner_id for (track_id, owner_id) in track_owners_query}
        # Generate list of owner ids
        track_owner_list = [owner_id for (track_id, owner_id) in track_owners_query]

        # build dict of owner_id --> follower_count
        follower_counts = (
            session.query(
                Follow.followee_user_id,
                func.count(Follow.followee_user_id)
            )
            .filter(
                Follow.is_current == True,
                Follow.is_delete == False,
                Follow.followee_user_id.in_(track_owner_list)
            )
            .group_by(Follow.followee_user_id)
            .all()
        )
        follower_count_dict = \
                {user_id: follower_count for (user_id, follower_count) in follower_counts}

        # Query save counts
        save_counts = get_save_counts(session, False, True, not_deleted_track_ids, None)
        # Generate track_id --> save_count mapping
        track_save_counts = {
            save_item_id: save_count
            for (save_item_id, save_count, save_type) in save_counts
            if save_type == SaveType.track
        }

        # Query save counts with respect to rolling time frame in URL (e.g. /trending/week -> window = rolling week)
        save_counts_for_time = get_save_counts(session, False, True, not_deleted_track_ids, None, None, time)
         # Generate track_id --> windowed_save_count mapping
        track_save_counts_for_time = {
            save_item_id: save_count
            for (save_item_id, save_count, save_type) in save_counts_for_time
            if save_type == SaveType.track
        }

        karma_query = get_karma(session, tuple(not_deleted_track_ids))
        karma_counts_for_id = {track_id: karma for (track_id, karma) in karma_query}

        trending_tracks = []
        for track_entry in listen_counts:
            # Skip over deleted tracks
            if track_entry[response_name_constants.track_id] not in not_deleted_track_ids:
                continue

            # Populate repost counts
            if track_entry[response_name_constants.track_id] in track_repost_counts:
                track_entry[response_name_constants.repost_count] = \
                        track_repost_counts[track_entry[response_name_constants.track_id]]
            else:
                track_entry[response_name_constants.repost_count] = 0

            # Populate repost counts with respect to time
            if track_entry[response_name_constants.track_id] in track_repost_counts_for_time:
                track_entry[response_name_constants.windowed_repost_count] = \
                    track_repost_counts_for_time[track_entry[response_name_constants.track_id]]
            else:
                track_entry[response_name_constants.windowed_repost_count] = 0

            # Populate save counts
            if track_entry[response_name_constants.track_id] in track_save_counts:
                track_entry[response_name_constants.save_count] = \
                        track_save_counts[track_entry[response_name_constants.track_id]]
            else:
                track_entry[response_name_constants.save_count] = 0

            # Populate save counts with respect to time
            if track_entry[response_name_constants.track_id] in track_save_counts_for_time:
                track_entry[response_name_constants.windowed_save_count] = \
                        track_save_counts_for_time[track_entry[response_name_constants.track_id]]
            else:
                track_entry[response_name_constants.windowed_save_count] = 0

            # Populate listen counts
            owner_id = track_owner_dict[track_entry[response_name_constants.track_id]]
            owner_follow_count = 0
            if owner_id in follower_count_dict:
                owner_follow_count = follower_count_dict[owner_id]
            track_entry[response_name_constants.track_owner_id] = owner_id
            track_entry[response_name_constants.track_owner_follower_count] = owner_follow_count

            # Populate created at timestamps
            if track_entry[response_name_constants.track_id] in track_created_at_dict:
                # datetime needs to be in isoformat for json.dumps() in `update_trending_cache()` to
                # properly process the dp response and add to redis cache
                # timespec = specifies additional components of the time to include
                track_entry[response_name_constants.created_at] = \
                        track_created_at_dict[track_entry[response_name_constants.track_id]] \
                            .isoformat(timespec='seconds')
            else:
                track_entry[response_name_constants.created_at] = None

            track_entry["karma"] = karma_counts_for_id[track_entry[response_name_constants.track_id]] \
                if track_entry[response_name_constants.track_id] in karma_counts_for_id else 0

            trending_tracks.append(track_entry)

    final_resp = {}
    final_resp['listen_counts'] = trending_tracks
    return final_resp
