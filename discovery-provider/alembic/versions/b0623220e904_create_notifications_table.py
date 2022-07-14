"""create notifications table

Revision ID: b0623220e904
Revises: 0dbe054f29f8
Create Date: 2022-06-27 17:04:24.686274

"""
import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "b0623220e904"
down_revision = "0dbe054f29f8"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "notification_block",
        sa.Column(
            "id", sa.Integer(), primary_key=True, nullable=False, autoincrement=True
        ),
        sa.Column("notification_id", sa.Integer(), nullable=True),
        sa.Column("slot", sa.Integer(), nullable=True),
        sa.Column("blocknumber", sa.Integer(), nullable=True),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("timestamp", sa.DateTime(), nullable=False),
        info={"if_not_exists": True},
    )

    op.create_table(
        "notification",
        sa.Column(
            "id", sa.Integer(), primary_key=True, nullable=False, autoincrement=True
        ),
        sa.Column("specifier", sa.String(), nullable=False),
        sa.Column("notification_block_id", sa.Integer(), nullable=True),
        sa.Column("type", sa.String(), nullable=False),
        sa.Column("slot", sa.Integer(), nullable=True),
        sa.Column("blocknumber", sa.Integer(), nullable=True),
        sa.Column("timestamp", sa.DateTime(), nullable=False),
        sa.Column("metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("user_ids", sa.ARRAY(sa.Integer), nullable=True),
        sa.ForeignKeyConstraint(
            ["notification_block_id"],
            ["notification_block.id"],
        ),
        info={"if_not_exists": True},
    )

    op.create_foreign_key(
        "fk_notification_block_notification",
        "notification_block",
        "notification",
        ["notification_id"],
        ["id"],
        info={"if_not_exists": True},
    )

    op.create_index(
        op.f("ix_notification"),
        "notification",
        ["user_ids"],
        unique=False,
        postgresql_using="gin",
        info={"if_not_exists": True},
    )

    op.create_index(
        op.f("ix_notification_block"),
        "notification_block",
        ["user_id", "timestamp"],
        unique=False,
        info={"if_not_exists": True},
    )


def downgrade():
    op.drop_index(
        op.f("ix_notification"),
        table_name="notification",
        info={"if_exists": True},
    )
    op.drop_table("notification", info={"if_exists": True})
    op.drop_table("notification_block", info={"if_exists": True})
    # ### end Alembic commands ###
