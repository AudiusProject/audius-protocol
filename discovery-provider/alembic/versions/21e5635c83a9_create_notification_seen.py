"""create notification seen

Revision ID: 21e5635c83a9
Revises: 1eec1d124caf
Create Date: 2022-12-01 19:58:39.403016

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = '21e5635c83a9'
down_revision = '1eec1d124caf'
branch_labels = None
depends_on = None


def foreign_key_exists(table_name, foreign_key):
    bind = op.get_context().bind
    insp = sa.inspect(bind)
    foreign_keys = insp.get_foreign_keys(table_name)
    return any(fk["name"] == foreign_key for fk in foreign_keys)


def column_exists(table_name, column_name):
    bind = op.get_context().bind
    insp = sa.inspect(bind)
    columns = insp.get_columns(table_name)
    return any(c["name"] == column_name for c in columns)


def upgrade():
    op.create_table(
        "notification_seen",
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("seen_at", sa.DateTime(), nullable=False),
        sa.Column("blocknumber", sa.Integer(), nullable=True),
        sa.Column("blockhash", sa.String(), nullable=True),
        sa.Column("txhash", sa.String(), nullable=True),
        sa.PrimaryKeyConstraint("user_id", "seen_at"),
        info={"if_not_exists": True},
    )
    if column_exists("notification", "notification_group_id"):
        op.drop_column("notification", "notification_group_id")
    op.drop_index(
        op.f("ix_notification_group"),
        table_name="notification_group",
        info={"if_exists": True},
    )

    op.drop_table("notification_group", info={"if_exists": True})


def downgrade():
    op.drop_table("notification_seen", info={"if_exists": True})
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
    if not column_exists("notification", "notification_group_id"):
        op.add_column(
            "notification",
            sa.Column("summed_count", sa.ForeignKey("notification_group.id")),
        )
    if foreign_key_exists("notification_group", "fk_notification_group_notification"):
        op.drop_constraint(
            "fk_notification_group_notification", "notification_group", "foreignkey"
        )

    op.create_index(
        op.f("ix_notification_group"),
        "notification_group",
        ["user_id", "timestamp"],
        unique=False,
        info={"if_not_exists": True},
    )
