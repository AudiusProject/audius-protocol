import re
from urllib.parse import urlparse

from flask.helpers import url_for

from src.api.v1 import api as api_v1
from src.api.v1.playlists import ns as playlists_ns
from src.api.v1.tracks import ns as tracks_ns
from src.api.v1.users import ns as users_ns
from src.models.users.user import User
from src.utils.config import shared_config
from src.utils.helpers import encode_int_id

track_url_regex = re.compile(r"^/(?P<handle>[^/]*)/(?P<slug>[^/]*)$")
playlist_url_regex = re.compile(r"/(?P<handle>[^/]*)/(playlist|album)/(?P<slug>[^/]*)$")
user_url_regex = re.compile(r"^/(?P<handle>[^/]*)$")

env = shared_config["discprov"]["env"]


def ns_url_for(ns, route, **kwargs):
    return url_for(
        f"{api_v1.bp.name}.{ns.name}_{route}",
        _scheme="https" if env == "stage" or env == "prod" else None,
        _external=True if env == "stage" or env == "prod" else None,
        **kwargs,
    )


def resolve_url(session, url):
    """
    Resolves an Audius URL into the cannonical API route.
    Accepts fully formed urls as well as just url paths.
    """
    parsed = urlparse(url)
    # Will strip out any preceding protocol & domain (e.g. https://audius.co)
    path = parsed.path

    match = track_url_regex.match(path)
    if match:
        slug = match.group("slug")
        handle = match.group("handle")
        return ns_url_for(tracks_ns, "bulk_tracks", slug=slug, handle=handle)

    match = playlist_url_regex.match(path)
    if match:
        slug = match.group("slug")
        handle = match.group("handle")
        return ns_url_for(
            playlists_ns, "playlist_by_handle_and_slug", slug=slug, handle=handle
        )

    match = user_url_regex.match(path)
    if match:
        handle = match.group("handle")
        user = (
            session.query(User)
            .filter(User.handle_lc == handle.lower(), User.is_current == True)
            .one()
        )
        hashed_id = encode_int_id(user.user_id)
        return ns_url_for(users_ns, "user", id=hashed_id)

    return None
