"""Change reaction column names

Revision ID: 0d2067242dd5
Revises: f11f9e83b28b
Create Date: 2022-05-09 22:03:16.838837

"""
import inspect

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0d2067242dd5"
down_revision = "f11f9e83b28b"
branch_labels = None
depends_on = None


def column_exists(table_name, column_name):
    bind = op.get_context().bind
    insp = sa.inspect(bind)
    columns = insp.get_columns(table_name)
    return any(c["name"] == column_name for c in columns)


def upgrade():
    # Handle lack of idempotency for this migration
    if column_exists("reactions", "entity_id"):
        op.alter_column("reactions", "entity_id", new_column_name="reacted_to")
    if column_exists("reactions", "entity_type"):
        op.alter_column("reactions", "entity_type", new_column_name="reaction_type")
    if column_exists("reactions", "reaction"):
        op.alter_column("reactions", "reaction", new_column_name="reaction_value")
    op.create_index(
        op.f("ix_reactions_reacted_to_reaction_type"),
        "reactions",
        ["reacted_to", "reaction_type"],
        unique=False,
        info={"if_not_exists": True},
    )


def downgrade():
    if column_exists("reactions", "reacted_to"):
        op.alter_column("reactions", "reacted_to", new_column_name="entity_id")
    if column_exists("reactions", "reaction_type"):
        op.alter_column("reactions", "reaction_type", new_column_name="entity_type")
    if column_exists("reactions", "reaction_value"):
        op.alter_column("reactions", "reaction_value", new_column_name="reaction")
    op.drop_index(
        op.f("ix_reactions_reacted_to_reaction_type"),
        table_name="reaction",
        info={"if_exists": True},
    )
