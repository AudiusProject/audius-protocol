"""nfc_unicode_routes

Revision ID: e68928955812
Revises: 9b4e12c0c428
Create Date: 2023-02-23 02:09:31.901048

"""
import unicodedata

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.types import Integer, String

# revision identifiers, used by Alembic.
revision = 'e68928955812'
down_revision = '9b4e12c0c428'
branch_labels = None
depends_on = None


def track_route_updates(connection):
    """
    Get all track routes. Check if the NFC normalized slug matches the value in the database.
    If no match, rewrite the NFC value to the database.
    """
    track_routes = connection.execute(
        """
            SELECT
                track_id,
                slug,
                title_slug
            FROM track_routes
            WHERE
                is_current = True
        """
    )
    track_ids = []
    slugs = []
    title_slugs = []
    for route in list(track_routes):
        [track_id, slug, title_slug] = route
        nfc_slug = unicodedata.normalize('NFC', slug)
        if nfc_slug != slug:
            nfc_title_slug = unicodedata.normalize('NFC', title_slug)
            track_ids.append(track_id)
            slugs.append(nfc_slug)
            title_slugs.append(nfc_title_slug)

    if len(track_ids) == 0: # no updates
        return

    params = {
        "track_ids": track_ids,
        "slugs": slugs,
        "title_slugs": title_slugs
    }

    sql = sa.text(
        """
            UPDATE track_routes SET
                slug = data_table.slug,
                title_slug = data_table.title_slug
            FROM
                (SELECT
                    unnest(:track_ids) as track_id,
                    unnest(:slugs) AS slug,
                    unnest(:title_slugs) as title_slug
                ) AS data_table
            WHERE
                track_routes.is_current = True
                AND track_routes.track_id = data_table.track_id
        """
    )
    sql = sql.bindparams(sa.bindparam("track_ids", ARRAY(Integer)))
    sql = sql.bindparams(sa.bindparam("slugs", ARRAY(String)))
    sql = sql.bindparams(sa.bindparam("title_slugs", ARRAY(String)))

    connection.execute(sql, params)


def playlist_route_updates(connection):
    """
    Get all playlist routes. Check if the NFC normalized slug matches the value in the database.
    If no match, rewrite the NFC value to the database.
    """
    playlist_routes = connection.execute(
        """
            SELECT
                playlist_id,
                slug,
                title_slug
            FROM playlist_routes
            WHERE
                is_current = True
        """
    )
    playlist_ids = []
    slugs = []
    title_slugs = []
    for route in list(playlist_routes):
        [track_id, slug, title_slug] = route
        nfc_slug = unicodedata.normalize('NFC', slug)
        if nfc_slug != slug:
            nfc_title_slug = unicodedata.normalize('NFC', title_slug)
            playlist_ids.append(track_id)
            slugs.append(nfc_slug)
            title_slugs.append(nfc_title_slug)

    if len(playlist_ids) == 0: # no updates
        return

    params = {
        "playlist_ids": playlist_ids,
        "slugs": slugs,
        "title_slugs": title_slugs
    }

    sql = sa.text(
        """
            UPDATE playlist_routes SET
                slug = data_table.slug,
                title_slug = data_table.title_slug
            FROM
                (SELECT
                    unnest(:playlist_ids) as playlist_id,
                    unnest(:slugs) AS slug,
                    unnest(:title_slugs) as title_slug
                ) AS data_table
            WHERE
                playlist_routes.is_current = True
                AND playlist_routes.playlist_id = data_table.playlist_id
        """
    )
    sql = sql.bindparams(sa.bindparam("playlist_ids", ARRAY(Integer)))
    sql = sql.bindparams(sa.bindparam("slugs", ARRAY(String)))
    sql = sql.bindparams(sa.bindparam("title_slugs", ARRAY(String)))

    connection.execute(sql, params)

def upgrade():
    connection = op.get_bind()
    track_route_updates(connection)
    playlist_route_updates(connection)


def downgrade():
    # No going back
    pass
