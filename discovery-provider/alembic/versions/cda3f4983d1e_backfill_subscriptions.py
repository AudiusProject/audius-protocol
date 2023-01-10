"""backfill_subscriptions

Revision ID: cda3f4983d1e
Revises: 2fad3671bf9f
Create Date: 2022-11-09 21:23:20.095764

"""
import os
from pathlib import Path

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = 'cda3f4983d1e'
down_revision = '2fad3671bf9f'
branch_labels = None
depends_on = None

def build_sql(env):
    if env == "stage":
        path = Path(__file__).parent.joinpath("../csvs/staging_subscriptions.csv")
    elif env == "prod":
        path = Path(__file__).parent.joinpath("../csvs/prod_subscriptions.csv")

    with open(path, 'r') as f:
        subscriber_ids = []
        user_ids = []
        for entry in f:
            subscriber_id, user_id = entry.split(",")
            subscriber_ids.append(int(subscriber_id))
            user_ids.append(int(user_id.strip()))
    num_records = len(subscriber_ids)
    params = {
        'subscriber_ids': subscriber_ids,
        'user_ids': user_ids,
        'is_currents': [True] * num_records,
        'is_deletes': [False] * num_records,
    }
# Do not backfill any subscriptions updated after the backfill data was pulled.
# In cases where discovery has an is_current=true, is_delete=true record created before the backfill data was
# pulled from identity, but the subscriber, user pair is in the identity csv, meaning there should
# be an active subscription, the INSERT will create 2 is_current=true records for the subscriber, user pair.
# As identity is the source of truth, DELETE the is_delete=true record.
    inner_sql = """
INSERT INTO subscriptions (subscriber_id, user_id, is_current, is_delete) SELECT * FROM (
    SELECT *
    FROM (
        SELECT
            unnest(:subscriber_ids) AS subscriber_id,
            unnest(:user_ids) AS user_id,
            unnest(:is_currents) AS is_current,
            unnest(:is_deletes) AS is_delete
    ) AS csv
    WHERE NOT EXISTS (
        SELECT *
        FROM subscriptions
        WHERE subscriptions.created_at >= '2023-01-10 05:00:00' AND subscriptions.is_current = true AND subscriptions.subscriber_id = csv.subscriber_id AND subscriptions.user_id = csv.user_id
    )
) AS identity_records;

DELETE FROM subscriptions
WHERE created_at < '2023-01-10 05:00:00' AND is_current = true AND is_delete = true AND EXISTS (
    SELECT *
    FROM (
        SELECT
            unnest(:subscriber_ids) AS subscriber_id,
            unnest(:user_ids) AS user_id
    ) AS csv
    WHERE csv.subscriber_id = subscriptions.subscriber_id AND csv.user_id = subscriptions.user_id
);
"""

    sql = sa.text("begin; \n\n " + inner_sql + " \n\n commit;")
    sql = sql.bindparams(sa.bindparam("subscriber_ids"))
    sql = sql.bindparams(sa.bindparam("user_ids"))
    sql = sql.bindparams(sa.bindparam("is_currents"))
    sql = sql.bindparams(sa.bindparam("is_deletes"))

    return (sql, params)

def upgrade():
    env = os.getenv("audius_discprov_env")
    if env == "stage" or env == "prod":
        connection = op.get_bind()
        sql, params = build_sql(env)
        connection.execute(sql, params)

def downgrade():
    pass
