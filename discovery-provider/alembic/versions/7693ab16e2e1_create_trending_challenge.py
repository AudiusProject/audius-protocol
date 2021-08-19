"""create_trending_challenge

Revision ID: 7693ab16e2e1
Revises: 9562cf365cf4
Create Date: 2021-08-12 12:54:57.042823

"""
from alembic import op
from sqlalchemy.orm.session import Session
import sqlalchemy as sa
from src.challenges.create_new_challenges import create_new_challenges


# revision identifiers, used by Alembic.
revision = "7693ab16e2e1"
down_revision = "9562cf365cf4"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "trending_results",
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("id", sa.String()),
        sa.Column("rank", sa.Integer(), nullable=False),
        sa.Column("type", sa.String(), nullable=False),
        sa.Column("version", sa.String(), nullable=False),
        sa.Column("week", sa.Date()),
        sa.PrimaryKeyConstraint("rank", "type", "version", "week"),
    )

    # Create the challenges if needed
    connection = op.get_bind()
    session = Session(bind=connection)
    allowed_challenge_types = set(["trending"])
    create_new_challenges(session, allowed_challenge_types)
    session.commit()
    session.close()


def downgrade():
    op.drop_table("trending_results")
