"""playlist seen notification

Revision ID: 4efaecad96fc
Revises: 1b6e405ef358
Create Date: 2022-12-30 19:29:24.733677

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = '4efaecad96fc'
down_revision = '1b6e405ef358'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "playlist_seen",
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("playlist_id", sa.Integer(), nullable=False),
        sa.Column("seen_at", sa.DateTime(), nullable=False),
        sa.Column("is_current", sa.Boolean(), nullable=False),
        sa.Column("blocknumber", sa.Integer(), nullable=True),
        sa.Column("blockhash", sa.String(), nullable=True),
        sa.Column("txhash", sa.String(), nullable=True),
        sa.PrimaryKeyConstraint("is_current", "user_id", "playlist_id", "seen_at"),
        info={"if_not_exists": True},
    )


def downgrade():
    op.drop_table("playlist_seen")
