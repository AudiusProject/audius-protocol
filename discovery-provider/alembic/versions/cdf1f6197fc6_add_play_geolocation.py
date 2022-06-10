"""add play geolocation

Revision ID: cdf1f6197fc6
Revises: 88daa6a4f269
Create Date: 2022-06-02 22:45:25.750913

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "cdf1f6197fc6"
down_revision = "88daa6a4f269"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "plays",
        sa.Column("city", sa.String(), server_default=None),
    )
    op.add_column(
        "plays",
        sa.Column("region", sa.String(), server_default=None),
    )
    op.add_column(
        "plays",
        sa.Column("country", sa.String(), server_default=None),
    )


def downgrade():
    op.drop_column("plays", "city")
    op.drop_column("plays", "region")
    op.drop_column("plays", "country")
