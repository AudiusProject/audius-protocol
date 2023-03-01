"""nfc_unicode_routes

Revision ID: e68928955812
Revises: abf8419b2dd5
Create Date: 2023-02-23 02:09:31.901048

"""
import unicodedata

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.types import Boolean, Integer, String

# revision identifiers, used by Alembic.
revision = "e68928955812"
down_revision = "abf8419b2dd5"
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
                slug,
                title_slug,
                collision_id,
                owner_id,
                track_id,
                blockhash,
                blocknumber,
                txhash
            FROM track_routes
            WHERE
                is_current = True
        """
    )
    slugs = []
    title_slugs = []
    collision_ids = []
    owner_ids = []
    track_ids = []
    blockhashes = []
    blocknumbers = []
    txhashes = []
    is_currents = []
    for route in list(track_routes):
        [
            slug,
            title_slug,
            collision_id,
            owner_id,
            track_id,
            blockhash,
            blocknumber,
            txhash,
        ] = route
        nfc_slug = unicodedata.normalize("NFC", slug)
        if nfc_slug != slug:
            nfc_title_slug = unicodedata.normalize("NFC", title_slug)
            slugs.append(nfc_slug)
            title_slugs.append(nfc_title_slug)
            collision_ids.append(collision_id)
            owner_ids.append(owner_id)
            track_ids.append(track_id)
            blockhashes.append(blockhash)
            blocknumbers.append(blocknumber)
            txhashes.append(txhash)
            is_currents.append(False)

    if len(track_ids) == 0:  # no updates
        return

    params = {
        "slugs": slugs,
        "title_slugs": title_slugs,
        "collision_ids": collision_ids,
        "owner_ids": owner_ids,
        "track_ids": track_ids,
        "blockhashes": blockhashes,
        "blocknumbers": blocknumbers,
        "txhashes": txhashes,
        "is_currents": is_currents,
    }

    sql = sa.text(
        """
            INSERT INTO track_routes
            (
                slug,
                title_slug,
                collision_id,
                owner_id,
                track_id,
                blockhash,
                blocknumber,
                txhash,
                is_current
            )
            SELECT * FROM UNNEST(
                :slugs,
                :title_slugs,
                :collision_ids,
                :owner_ids,
                :track_ids,
                :blockhashes,
                :blocknumbers,
                :txhashes,
                :is_currents
            )
            ON CONFLICT DO NOTHING;
        """
    )
    sql = sql.bindparams(sa.bindparam("slugs", ARRAY(String)))
    sql = sql.bindparams(sa.bindparam("title_slugs", ARRAY(String)))
    sql = sql.bindparams(sa.bindparam("collision_ids", ARRAY(Integer)))
    sql = sql.bindparams(sa.bindparam("owner_ids", ARRAY(Integer)))
    sql = sql.bindparams(sa.bindparam("track_ids", ARRAY(Integer)))
    sql = sql.bindparams(sa.bindparam("blockhashes", ARRAY(String)))
    sql = sql.bindparams(sa.bindparam("blocknumbers", ARRAY(Integer)))
    sql = sql.bindparams(sa.bindparam("txhashes", ARRAY(String)))
    sql = sql.bindparams(sa.bindparam("is_currents", ARRAY(Boolean)))

    connection.execute(sql, params)


def playlist_route_updates(connection):
    """
    Get all playlist routes. Check if the NFC normalized slug matches the value in the database.
    If no match, rewrite the NFC value to the database.
    """
    playlist_routes = connection.execute(
        """
            SELECT
                slug,
                title_slug,
                collision_id,
                owner_id,
                playlist_id,
                blockhash,
                blocknumber,
                txhash
            FROM playlist_routes
            WHERE
                is_current = True
        """
    )

    slugs = []
    title_slugs = []
    collision_ids = []
    owner_ids = []
    playlist_ids = []
    blockhashes = []
    blocknumbers = []
    txhashes = []
    is_currents = []
    for route in list(playlist_routes):
        [
            slug,
            title_slug,
            collision_id,
            owner_id,
            playlist_id,
            blockhash,
            blocknumber,
            txhash,
        ] = route
        nfc_slug = unicodedata.normalize("NFC", slug)
        if nfc_slug != slug:
            nfc_title_slug = unicodedata.normalize("NFC", title_slug)
            slugs.append(nfc_slug)
            title_slugs.append(nfc_title_slug)
            collision_ids.append(collision_id)
            owner_ids.append(owner_id)
            playlist_ids.append(playlist_id)
            blockhashes.append(blockhash)
            blocknumbers.append(blocknumber)
            txhashes.append(txhash)
            is_currents.append(False)

    if len(playlist_ids) == 0:  # no updates
        return

    params = {
        "slugs": slugs,
        "title_slugs": title_slugs,
        "collision_ids": collision_ids,
        "owner_ids": owner_ids,
        "playlist_ids": playlist_ids,
        "blockhashes": blockhashes,
        "blocknumbers": blocknumbers,
        "txhashes": txhashes,
        "is_currents": is_currents,
    }

    sql = sa.text(
        """
            INSERT INTO playlist_routes
            (
                slug,
                title_slug,
                collision_id,
                owner_id,
                playlist_id,
                blockhash,
                blocknumber,
                txhash,
                is_current
            )
            SELECT * FROM UNNEST(
                :slugs,
                :title_slugs,
                :collision_ids,
                :owner_ids,
                :playlist_ids,
                :blockhashes,
                :blocknumbers,
                :txhashes,
                :is_currents
            )
            ON CONFLICT DO NOTHING;
        """
    )
    sql = sql.bindparams(sa.bindparam("slugs", ARRAY(String)))
    sql = sql.bindparams(sa.bindparam("title_slugs", ARRAY(String)))
    sql = sql.bindparams(sa.bindparam("collision_ids", ARRAY(Integer)))
    sql = sql.bindparams(sa.bindparam("owner_ids", ARRAY(Integer)))
    sql = sql.bindparams(sa.bindparam("playlist_ids", ARRAY(Integer)))
    sql = sql.bindparams(sa.bindparam("blockhashes", ARRAY(String)))
    sql = sql.bindparams(sa.bindparam("blocknumbers", ARRAY(Integer)))
    sql = sql.bindparams(sa.bindparam("txhashes", ARRAY(String)))
    sql = sql.bindparams(sa.bindparam("is_currents", ARRAY(Boolean)))

    connection.execute(sql, params)


def upgrade():
    connection = op.get_bind()
    track_route_updates(connection)
    playlist_route_updates(connection)


def downgrade():
    # No going back
    pass
