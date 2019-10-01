import logging # pylint: disable=C0302
import requests
import sqlalchemy
from sqlalchemy import func, asc, desc
from sqlalchemy.orm import aliased

from flask import Blueprint, request
from urllib.parse import urljoin

from src import api_helpers, exceptions
from src.models import User, Track, RepostType, Follow, SaveType
from src.utils import helpers
from src.utils.db_session import get_db
from src.utils.config import shared_config
from src.queries import response_name_constants
from src.queries.query_helpers import get_repost_counts, get_pagination_vars, get_save_counts

logger = logging.getLogger(__name__)
bp = Blueprint("trending", __name__)


######## ROUTES ########

@bp.route("/trending/<time>", methods=("GET",))
def trending(time):
    identity_url = shared_config['discprov']['identity_service_url']
    identity_trending_endpoint = urljoin(identity_url, f"/tracks/trending/{time}")

    (limit, offset) = get_pagination_vars()
    queryparams = {}
    queryparams["limit"] = limit
    queryparams["offset"] = offset

    resp = None
    try:
        resp = requests.get(identity_trending_endpoint, params=queryparams)
    except Exception as e:
        logger.error(
            f'Error retrieving trending info - {identity_trending_endpoint}, {queryparams}'
        )
        raise e

    json_resp = resp.json()
    if "error" in json_resp:
        return api_helpers.error_response(json_resp["error"], 500)

    listen_counts = json_resp["listenCounts"]
    # Convert trackId to snakeCase
    for track_entry in listen_counts:
        track_entry[response_name_constants.track_id] = track_entry['trackId']
        del track_entry['trackId']

    track_ids = [track[response_name_constants.track_id] for track in listen_counts]

    db = get_db()
    with db.scoped_session() as session:
        # Query repost counts
        repost_counts = get_repost_counts(session, False, True, track_ids, None)
        track_repost_counts = {
            repost_item_id: repost_count
            for (repost_item_id, repost_count, repost_type) in repost_counts
            if repost_type == RepostType.track
        }

        # Query follower info for each track owner
        # Query each track owner
        track_owners_query = (
            session.query(Track.track_id, Track.owner_id)
            .filter
            (
                Track.is_current == True,
                Track.track_id.in_(track_ids)
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

        save_counts = get_save_counts(session, False, True, track_ids, None)
        track_save_counts = {
            save_item_id: save_count
            for (save_item_id, save_count, save_type) in save_counts
            if save_type == SaveType.track
        }

        for track_entry in listen_counts:
            # Populate repost counts
            if track_entry[response_name_constants.track_id] in track_repost_counts:
                track_entry[response_name_constants.repost_count] = \
                        track_repost_counts[track_entry[response_name_constants.track_id]]
            else:
                track_entry[response_name_constants.repost_count] = 0
            
            # Populate save counts
            if track_entry[response_name_constants.track_id] in track_save_counts:
                track_entry[response_name_constants.save_count] = \
                        track_save_counts[track_entry[response_name_constants.track_id]]
            else:
                track_entry[response_name_constants.save_count] = 0

            # Populate listen counts
            owner_id = track_owner_dict[track_entry[response_name_constants.track_id]]
            owner_follow_count = 0
            if owner_id in follower_count_dict:
                owner_follow_count = follower_count_dict[owner_id]
            track_entry[response_name_constants.track_owner_id] = owner_id
            track_entry[response_name_constants.track_owner_follower_count] = owner_follow_count

    final_resp = {}
    final_resp['listen_counts'] = listen_counts
    return api_helpers.success_response(final_resp)

