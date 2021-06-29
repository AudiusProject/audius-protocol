"""create track routes table

Revision ID: 301b1e42dc4b
Revises: 436c10e54758
Create Date: 2021-06-09 20:51:52.531039

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.orm import sessionmaker


# revision identifiers, used by Alembic.
revision = "301b1e42dc4b"
down_revision = "436c10e54758"
branch_labels = None
depends_on = None

Session = sessionmaker()


def upgrade():
    op.create_table(
        "track_routes",
        sa.Column("slug", sa.String(), nullable=False, index=False),
        sa.Column("title_slug", sa.String(), nullable=False, index=False),
        sa.Column("collision_id", sa.Integer(), nullable=False, index=False),
        sa.Column("owner_id", sa.Integer(), nullable=False, index=False),
        sa.Column("track_id", sa.Integer(), nullable=False, index=False),
        sa.Column("is_current", sa.Boolean(), nullable=False, index=False),
        sa.Column("blockhash", sa.String(), nullable=False, index=False),
        sa.Column("blocknumber", sa.Integer(), nullable=False, index=False),
        sa.PrimaryKeyConstraint("owner_id", "slug"),
        sa.Index("track_id", "is_current")
    )
    bind = op.get_bind()
    session = Session(bind=bind)

    # Bring over existing routes (current tracks)
    session.execute(
        sa.text(
            """
            INSERT INTO track_routes (
                track_id
                , owner_id
                , slug
                , title_slug
                , collision_id
                , is_current
                , blockhash
                , blocknumber
            )
            SELECT
                track_id
                , owner_id
                , CONCAT(SPLIT_PART(route_id, '/', 2),  '-', track_id)
                    AS slug
                , CONCAT(SPLIT_PART(route_id, '/', 2),  '-', track_id)
                    AS title_slug
                , 0 AS collision_id
                , is_current
                , blockhash
                , blocknumber
            FROM tracks
            WHERE is_current
            GROUP BY
                owner_id
                , track_id
                , route_id
                , is_current
                , blockhash
                , blocknumber;
            """
        )
    )

    # Bring over existing routes (non-current tracks)
    session.execute(
        sa.text(
            """
            INSERT INTO track_routes (
                track_id
                , owner_id
                , slug
                , title_slug
                , collision_id
                , is_current
                , blockhash
                , blocknumber
            )
            SELECT
                t.track_id
                , t.owner_id
                , t.slug
                , t.title_slug
                , t.collision_id
                , t.is_current
                , t.blockhash
                , t.blocknumber
            FROM (
                SELECT
                    nc.track_id
                    , nc.owner_id
                    , CONCAT(
                            SPLIT_PART(nc.route_id, '/', 2),
                            '-',
                            nc.track_id
                        ) AS slug
                    , CONCAT(
                            SPLIT_PART(nc.route_id, '/', 2),
                            '-',
                            nc.track_id
                        ) AS title_slug
                    , 0 AS collision_id
                    , nc.is_current
                    , nc.blockhash
                    , nc.blocknumber
                    , ROW_NUMBER() OVER (
                            PARTITION BY nc.route_id
                            ORDER BY nc.blocknumber DESC
                        ) AS rank
                FROM tracks AS c_tracks
                JOIN tracks AS nc
                ON c_tracks.track_id = nc.track_id
                WHERE NOT nc.is_current
                AND c_tracks.is_current
                AND NOT nc.route_id = c_tracks.route_id
            ) t
            WHERE t.rank = 1;
            """
        )
    )


def downgrade():
    op.drop_table("track_routes")
