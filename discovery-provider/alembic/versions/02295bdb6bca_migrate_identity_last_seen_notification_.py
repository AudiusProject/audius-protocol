"""migrate identity last seen notification to discovery

Revision ID: 02295bdb6bca
Revises: e97a5ba523fc
Create Date: 2023-03-14 20:37:36.148935

"""
import csv
import os
from pathlib import Path

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "02295bdb6bca"
down_revision = "e97a5ba523fc"
branch_labels = None
depends_on = None


ENV = os.getenv("audius_discprov_env")
ENV_TO_FILEPATH = {
    "stage": "../csvs/staging_user_last_notif_seen_results.csv",
    "prod": "../csvs/prod_user_last_notif_seen_results.csv",
}


# Note: CSV contents were pulled using the following commands on
# identity db:
# \copy (select  "userId" as user_id, max("updatedAt") as latest_user_notification_seen
# from "Notifications" where "isRead" group by "userId"
# order by max("updatedAt") desc) to 'user_last_notif_seen_results.csv'
# with (format csv, header)
def get_user_ids_and_seen_ats(path):
    user_ids = []
    user_last_seen_ats = []
    csv_filepath = Path(__file__).parent.joinpath(path)
    with open(csv_filepath) as csv_file:
        csv_reader = csv.reader(csv_file, delimiter=",")
        for row in csv_reader:
            user_ids.append(row[0])
            user_last_seen_ats.append(row[1])
        return user_ids, user_last_seen_ats


def upgrade():
    if ENV == "prod" or ENV == "stage":
        connection = op.get_bind()
        user_ids, users_last_seen_at = get_user_ids_and_seen_ats(
            path=ENV_TO_FILEPATH[ENV],
        )
        sql = sa.text(
            """
            INSERT INTO notification_seen(user_id, seen_at)
            SELECT user_id, user_last_seen_at
            FROM (SELECT unnest(:user_ids)::integer AS user_id,
                 to_timestamp(unnest(:user_last_seen_ats), 'YYYY-MM-DD HH24:MI:SS') AS user_last_seen_at)
                 AS csv
            """
        )
        sql = sql.bindparams(sa.bindparam("user_ids"))
        sql = sql.bindparams(sa.bindparam("user_last_seen_ats"))
        params = {"user_last_seen_ats": users_last_seen_at, "user_ids": user_ids}
        connection.execute(sql, params)


def downgrade():
    if ENV == "prod" or ENV == "stage":
        connection = op.get_bind()
        delete_query = "TRUNCATE TABLE notification_seen"
        connection.execute(delete_query)
