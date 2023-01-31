import logging
import urllib.parse
from typing import List, Tuple

from lxml import etree
from sqlalchemy import asc, func
from sqlalchemy.orm.session import Session
from src.models.playlists.playlist import Playlist
from src.models.playlists.playlist_route import PlaylistRoute
from src.models.tracks.track import Track
from src.models.tracks.track_route import TrackRoute
from src.models.users.aggregate_user import AggregateUser
from src.models.users.user import User
from src.utils.get_all_other_nodes import get_node_endpoint

logger = logging.getLogger(__name__)

root_site_maps_routes = [
    "defaults.xml",
    "tracks/index.xml",
    "collections/index.xml",
    "users/index.xml",
]


def get_client_base_url():
    return "https://audius.co"


def set_base_url():
    endpoint = get_node_endpoint()
    return endpoint


def create_client_url(route):
    client_base = get_client_base_url()
    safe_route = urllib.parse.quote(route)
    return f"{client_base}/{safe_route}"


def create_xml_url(route):
    self_base = set_base_url()
    safe_route = urllib.parse.quote(route)
    return f"{self_base}/{safe_route}"


default_routes = [
    # static
    "legal/privacy-policy",
    "legal/terms-of-use",
    "download",
    # app
    "feed",
    "trending",
    "explore",
    "explore/playlists",
    "explore/underground",
    "explore/top-albums",
    "explore/remixables",
    "explore/feeling-lucky",
    "explore/chill",
    "explore/upbeat",
    "explore/intense",
    "explore/provoking",
    "explore/intimate",
    "signup",
    "signin",
]

# The max number of urls that can be in a single sitemap
LIMIT = 50_000


def build_default():
    root = etree.Element("urlset", xmlns="http://www.sitemaps.org/schemas/sitemap/0.9")
    for site_map_route in default_routes:
        sitemap_el = etree.Element("url")
        loc = etree.Element("loc")
        loc.text = create_client_url(site_map_route)
        sitemap_el.append(loc)
        root.append(sitemap_el)

    # pretty string
    return etree.tostring(root, pretty_print=True)


def get_max_track_count(session: Session) -> int:
    max = (
        session.query(func.count(Track.track_id))
        .filter(Track.is_current == True, Track.stem_of == None)
        .one()
    )
    return max[0]


def get_max_user_count(session: Session) -> int:
    max = session.query(func.count(AggregateUser.user_id)).one()
    return max[0]


def get_max_playlist_count(session: Session) -> int:
    max = (
        session.query(func.count(Playlist.playlist_id))
        .filter(
            Playlist.is_current == True,
            Playlist.is_private == False,
            Playlist.is_delete == False,
        )
        .one()
    )
    return max[0]


def get_dynamic_root(max: int, base_route: str, limit: int = LIMIT):
    num_pages = (max // limit) + 1 if max % limit != 0 else int(max / limit)
    root = etree.Element(
        "sitemapindex", xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
    )
    for num in range(num_pages):
        sitemap_el = etree.Element("sitemap")
        loc = etree.Element("loc")
        loc.text = create_xml_url(f"sitemaps/{base_route}/{num+1}.xml")
        sitemap_el.append(loc)
        root.append(sitemap_el)

    return etree.tostring(root, pretty_print=True)


def get_entity_page(slugs: List[str]):
    root = etree.Element("urlset", xmlns="http://www.sitemaps.org/schemas/sitemap/0.9")
    for slug in slugs:
        sitemap_url = etree.Element("url")
        loc = etree.Element("loc")
        loc.text = create_client_url(slug)
        sitemap_url.append(loc)
        root.append(sitemap_url)
    return etree.tostring(root, pretty_print=True)


def get_track_slugs(session: Session, limit: int, offset: int):
    slugs: List[str] = (
        session.query(User.handle_lc, TrackRoute.slug)
        .join(Track, TrackRoute.track_id == Track.track_id)
        .join(User, TrackRoute.owner_id == User.user_id)
        .filter(
            Track.is_current == True,
            Track.stem_of == None,
            User.is_current == True,
            TrackRoute.is_current == True,
        )
        .order_by(asc(Track.track_id))
        .limit(limit)
        .offset(offset)
        .all()
    )

    return [f"{slug[0]}/{slug[1]}" for slug in slugs]


def get_playlist_slugs(session: Session, limit: int, offset: int):
    slugs: List[Tuple[str, str]] = (
        session.query(
            User.handle_lc,
            PlaylistRoute.slug,
        )
        .join(User, User.user_id == Playlist.playlist_owner_id)
        .join(Playlist, PlaylistRoute.playlist_id == Playlist.playlist_id)
        .filter(
            User.is_current == True,
            PlaylistRoute.is_current == False,
            Playlist.is_current == True,
            Playlist.is_private == False,
        )
        .order_by(asc(Playlist.playlist_id))
        .limit(limit)
        .offset(offset)
        .all()
    )
    return [f"{slug[0]}/{slug[1]}" for slug in slugs]


def get_user_slugs(session: Session, limit: int, offset: int):
    slugs = (
        session.query(User.handle_lc)
        .filter(
            User.is_current == True,
            User.is_deactivated == False,
            User.handle_lc != None,
        )
        .order_by(asc(User.user_id))
        .limit(limit)
        .offset(offset)
        .all()
    )

    return [slug[0] for slug in slugs]


def get_track_root(session: Session, limit: int = LIMIT):
    max_track_count = get_max_track_count(session)
    return get_dynamic_root(max_track_count, "track", limit)


def get_playlist_root(session: Session, limit: int = LIMIT):
    max_track_count = get_max_playlist_count(session)
    return get_dynamic_root(max_track_count, "playlist", limit)


def get_user_root(session: Session, limit: int = LIMIT):
    max_user_count = get_max_user_count(session)
    return get_dynamic_root(max_user_count, "user", limit)


def get_track_page(session: Session, page: int, limit: int = LIMIT):
    offset = (page - 1) * limit
    slugs = get_track_slugs(session, limit, offset)
    return get_entity_page(slugs)


def get_playlist_page(session: Session, page: int, limit: int = LIMIT):
    offset = (page - 1) * limit
    slugs = get_playlist_slugs(session, limit, offset)
    return get_entity_page(slugs)


def get_user_page(session: Session, page: int, limit: int = LIMIT):
    offset = (page - 1) * limit
    slugs = get_user_slugs(session, limit, offset)
    return get_entity_page(slugs)
