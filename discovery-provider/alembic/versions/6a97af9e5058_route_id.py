"""route_id

Revision ID: 6a97af9e5058
Revises: cf614359625e
Create Date: 2019-11-14 17:07:02.579491

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.orm import sessionmaker
from src.utils import helpers

# revision identifiers, used by Alembic.
revision = "6a97af9e5058"
down_revision = "cf614359625e"
branch_labels = None
depends_on = None

Session = sessionmaker()


def upgrade():
    op.add_column("tracks", sa.Column("route_id", sa.String, nullable=True))
    bind = op.get_bind()
    session = Session(bind=bind)
    res = session.execute(
        sa.text(
            """SELECT t."title", t."track_id", t."blockhash", u."user_id", u."handle" FROM "tracks" t INNER JOIN "users" u on "t"."owner_id" = u."user_id" AND u."is_current" = true;"""
        )
    ).fetchall()

    route_ids = [helpers.create_track_route_id(r[0], r[4]) for r in res]

    for i in range(len(route_ids)):
        session.execute(
            sa.text(
                f"""UPDATE "tracks" SET "route_id" = '{route_ids[i]}' WHERE "blockhash" = '{res[i][2]}' AND "track_id" = '{res[i][1]}'"""
            )
        )


def downgrade():
    op.drop_column("tracks", "route_id")
