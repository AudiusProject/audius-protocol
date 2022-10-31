"""Create playlist_routes table

Revision ID: bead88b41a20
Revises: a8752810936c
Create Date: 2022-10-28 18:08:50.677819

"""
import sqlalchemy as sa
from alembic import op
from sqlalchemy.orm import sessionmaker

# revision identifiers, used by Alembic.
revision = "bead88b41a20"
down_revision = "a8752810936c"
branch_labels = None
depends_on = None

Session = sessionmaker()


def upgrade():
    op.create_table(
        "playlist_routes",
        sa.Column("slug", sa.String(), nullable=False, index=False),
        sa.Column("title_slug", sa.String(), nullable=False, index=False),
        sa.Column("collision_id", sa.Integer(), nullable=False, index=False),
        sa.Column("owner_id", sa.Integer(), nullable=False, index=False),
        sa.Column("playlist_id", sa.Integer(), nullable=False, index=False),
        sa.Column("is_current", sa.Boolean(), nullable=False, index=False),
        sa.Column("blockhash", sa.String(), nullable=False, index=False),
        sa.Column("blocknumber", sa.Integer(), nullable=False, index=False),
        sa.Column("txhash", sa.String(), nullable=False, index=False),
        sa.PrimaryKeyConstraint("owner_id", "slug"),
        sa.Index("playlist_id", "is_current"),
    )
    # bind = op.get_bind()
    # session = Session(bind=bind)

    # # Bring over existing routes (current tracks)
    # session.execute(
    #     sa.text(
    #         """
    #         INSERT INTO playlist_routes (
    #             playlist_id
    #             , owner_id
    #             , slug
    #             , title_slug
    #             , collision_id
    #             , is_current
    #             , blockhash
    #             , blocknumber
    #             , txhash
    #         )
    #         SELECT
    #             playlist_id
    #             , owner_id
    #             , CONCAT(SPLIT_PART(route_id, '/', 2),  '-', playlist_id)
    #                 AS slug
    #             , CONCAT(SPLIT_PART(route_id, '/', 2),  '-', playlist_id)
    #                 AS title_slug
    #             , 0 AS collision_id
    #             , is_current
    #             , blockhash
    #             , blocknumber
    #             ,txhash
    #         FROM tracks
    #         WHERE is_current
    #         GROUP BY
    #             owner_id
    #             , playlist_id
    #             , route_id
    #             , is_current
    #             , blockhash
    #             , blocknumber
    #             , txhash;
    #         """
    #     )
    # )

    # # Bring over existing routes (non-current tracks)
    # session.execute(
    #     sa.text(
    #         """
    #         INSERT INTO playlist_routes (
    #             playlist_id
    #             , owner_id
    #             , slug
    #             , title_slug
    #             , collision_id
    #             , is_current
    #             , blockhash
    #             , blocknumber
    #             , txhash
    #         )
    #         SELECT
    #             p.playlist_id
    #             , p.owner_id
    #             , p.slug
    #             , p.title_slug
    #             , p.collision_id
    #             , p.is_current
    #             , p.blockhash
    #             , p.blocknumber
    #             , p.txhash
    #         FROM (
    #             SELECT
    #                 nc.playlist_id
    #                 , nc.playlist_owner_id
    #                 , CONCAT(
    #                     # TODO: UPDATE ROUTE ID
    #                         SPLIT_PART(nc.route_id, '/', 2),
    #                         '-',
    #                         nc.playlist_id
    #                     ) AS slug
    #                 , CONCAT(
    #                         SPLIT_PART(nc.route_id, '/', 2),
    #                         '-',
    #                         nc.playlist_id
    #                     ) AS title_slug
    #                 , 0 AS collision_id
    #                 , nc.is_current
    #                 , nc.blockhash
    #                 , nc.blocknumber
    #                 , nc.txhash
    #                 , ROW_NUMBER() OVER (
    #                         PARTITION BY nc.route_id
    #                         ORDER BY nc.blocknumber DESC
    #                     ) AS rank
    #             FROM playlists AS c_playlists
    #             JOIN playlists AS nc
    #             ON c_playlists.playlist_id = nc.playlist_id
    #             WHERE NOT nc.is_current
    #             AND c_playlists.is_current
    #             AND NOT nc.route_id = c_playlists.route_id
    #         ) p
    #         WHERE p.rank = 1;
    #         """
    #     )
    # )


def downgrade():
    op.drop_table("playlist_routes")
