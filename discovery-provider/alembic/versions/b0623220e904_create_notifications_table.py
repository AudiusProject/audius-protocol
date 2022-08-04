"""create notifications table

Revision ID: b0623220e904
Revises: d0dfb103535b
Create Date: 2022-06-27 17:04:24.686274

"""
import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "b0623220e904"
down_revision = "d0dfb103535b"
branch_labels = None
depends_on = None


def foreign_key_exists(table_name, foreign_key):
    bind = op.get_context().bind
    insp = sa.inspect(bind)
    foreign_keys = insp.get_foreign_keys(table_name)
    return any(fk["name"] == foreign_key for fk in foreign_keys)


def upgrade():
    op.create_table(
        "notification_group",
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
        sa.Column("notification_group_id", sa.Integer(), nullable=True),
        sa.Column("type", sa.String(), nullable=False),
        sa.Column("slot", sa.Integer(), nullable=True),
        sa.Column("blocknumber", sa.Integer(), nullable=True),
        sa.Column("timestamp", sa.DateTime(), nullable=False),
        sa.Column("data", postgresql.JSONB(), nullable=True),
        sa.Column("user_ids", sa.ARRAY(sa.Integer), nullable=True),
        sa.ForeignKeyConstraint(
            ["notification_group_id"],
            ["notification_group.id"],
        ),
        info={"if_not_exists": True},
    )
    if not foreign_key_exists(
        "notification_group", "fk_notification_group_notification"
    ):
        op.create_foreign_key(
            "fk_notification_group_notification",
            "notification_group",
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
        op.f("ix_notification_group"),
        "notification_group",
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
    op.drop_constraint(
        "fk_notification_group_notification",
        "notification_group",
        "foreignkey",
        info={"if_exists": True},
    )
    op.drop_table("notification", info={"if_exists": True})
    op.drop_table("notification_group", info={"if_exists": True})
    # ### end Alembic commands ###
