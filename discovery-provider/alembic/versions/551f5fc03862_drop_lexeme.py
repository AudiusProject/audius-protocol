"""drop lexeme

Revision ID: 551f5fc03862
Revises: 5d3f95470222
Create Date: 2022-08-23 15:48:14.787788

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "551f5fc03862"
down_revision = "5d3f95470222"
branch_labels = None
depends_on = None


def upgrade():
    connection = op.get_bind()
    connection.execute(
        sa.text(
            """

        drop materialized view if exists track_lexeme_dict;
        drop materialized view if exists user_lexeme_dict;
        drop materialized view if exists playlist_lexeme_dict;
        drop materialized view if exists album_lexeme_dict;

        """
        )
    )


def downgrade():
    connection = op.get_bind()
    connection.execute(
        sa.text(
            """

        drop materialized view if exists track_lexeme_dict;
        drop materialized view if exists user_lexeme_dict;
        drop materialized view if exists playlist_lexeme_dict;
        drop materialized view if exists album_lexeme_dict;

        """
        )
    )
