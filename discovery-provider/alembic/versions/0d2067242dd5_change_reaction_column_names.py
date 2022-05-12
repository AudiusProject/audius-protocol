"""Change reaction column names

Revision ID: 0d2067242dd5
Revises: 35198266d709
Create Date: 2022-05-09 22:03:16.838837

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0d2067242dd5"
down_revision = "35198266d709"
branch_labels = None
depends_on = None


def upgrade():
    # Handle lack of idempotency for this migration
    try:
        op.alter_column("reactions", "entity_id", new_column_name="reacted_to")
        op.alter_column("reactions", "entity_type", new_column_name="reaction_type")
        op.alter_column("reactions", "reaction", new_column_name="reaction_value")
        op.create_index(
            op.f("ix_reactions_reacted_to_reaction_type"),
            "reactions",
            ["reacted_to", "reaction_type"],
            unique=False,
            info={"if_not_exists": True},
        )
    except BaseException as e:
        pass


def downgrade():
    try:
        op.alter_column("reactions", "reacted_to", new_column_name="entity_id")
        op.alter_column("reactions", "reaction_type", new_column_name="entity_type")
        op.alter_column("reactions", "reaction_value", new_column_name="reaction")
        op.drop_index(
            op.f("ix_reactions_reacted_to_reaction_type"),
            table_name="reaction",
            info={"if_exists": True},
        )
    except BaseException as e:
        pass
