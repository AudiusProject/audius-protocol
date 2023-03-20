"""migrate identity last seen notification to discovery

Revision ID: 02295bdb6bca
Revises: b9b7a1444783
Create Date: 2023-03-14 20:37:36.148935

"""
import csv
import os
from pathlib import Path

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "02295bdb6bca"
down_revision = "b9b7a1444783"
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
def insert_csv_contents_into_temp_table(path, connection, temp_table_name):
    csv_filepath = Path(__file__).parent.joinpath(path)
    with open(csv_filepath) as csv_file:
        csv_reader = csv.reader(csv_file, delimiter=",")
        for row in csv_reader:
            connection.execute(
                "INSERT INTO {} (user_id, seen_at) VALUES ({}, '{}')".format(
                    temp_table_name, row[0], row[1]
                )
            )


def upgrade():
    if ENV == "stage" or ENV == "prod":
        connection = op.get_bind()
        op.create_table(
            "temp_notification_seen",
            sa.Column("user_id", sa.Integer(), nullable=False),
            sa.Column("seen_at", sa.DateTime(), nullable=False),
        )
        insert_csv_contents_into_temp_table(
            path=ENV_TO_FILEPATH[ENV],
            connection=connection,
            temp_table_name="temp_notification_seen",
        )

        connection.execute(
            "INSERT INTO notification_seen (user_id, seen_at) SELECT user_id, seen_at FROM temp_notification_seen"
        )
        op.drop_table("temp_notification_seen")


def downgrade():
    connection = op.get_bind()
    delete_query = "TRUNCATE TABLE notification_seen"
    connection.execute(delete_query)
