"""create track routes table

Revision ID: 301b1e42dc4b
Revises: 05e2eeb2bd03
Create Date: 2021-06-09 20:51:52.531039

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.orm import sessionmaker


# revision identifiers, used by Alembic.
revision = "301b1e42dc4b"
down_revision = "7f4f44a8e880"
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
        sa.Index("owner_id", "slug"),
        sa.UniqueConstraint("owner_id", "slug"),
        sa.PrimaryKeyConstraint("track_id", "is_current")
    )
    bind = op.get_bind()
    session = Session(bind=bind)

    # Bring over existing routes
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
            )
            SELECT
                track_id
                , owner_id
                , CONCAT(SPLIT_PART(route_id, '/', 2),  '-', track_id) as slug
                , CONCAT(SPLIT_PART(route_id, '/', 2),  '-', track_id) as title_slug
                , 0 AS collision_id
                , is_current
            FROM tracks
            WHERE is_current
            GROUP BY owner_id, track_id, route_id, is_current;
            """
        )
    )


def downgrade():
    op.drop_table("track_routes")
