"""Drop play signature index

Revision ID: 5bd737667c70
Revises: 988f095a1d43
Create Date: 2023-02-13 17:45:15.082946

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "5bd737667c70"
down_revision = "988f095a1d43"
branch_labels = None
depends_on = None


def upgrade():
    op.drop_index(
        op.f("ix_plays_sol_signature"),
        table_name="plays",
        info={"if_exists": True},
    )


def downgrade():
    op.create_index(
        op.f("ix_plays_sol_signature"),
        "plays",
        ["signature"],
        unique=False,
        info={"if_not_exists": True},
    )
