"""backfill_subscriptions

Revision ID: cda3f4983d1e
Revises: f91c041d1d8d
Create Date: 2022-11-09 21:23:20.095764

"""
import os
from pathlib import Path

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = 'cda3f4983d1e'
down_revision = 'f91c041d1d8d'
branch_labels = None
depends_on = None

def build_sql(up, env):
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
    if up:
        inner_sql = "INSERT INTO subscriptions (subscriber_id, user_id, is_current, is_delete) VALUES (unnest(:subscriber_ids), unnest(:user_ids), unnest(:is_currents), unnest(:is_deletes)) ON CONFLICT (subscriber_id, user_id, is_current) DO NOTHING;"
    else:
        inner_sql = "DELETE FROM subscriptions WHERE (subscriber_id, user_id, is_current, is_delete) IN (SELECT unnest(:subscriber_ids), unnest(:user_ids), unnest(:is_currents), unnest(:is_deletes));"
    sql = sa.text("begin; \n\n " + inner_sql + " \n\n commit;")
    sql = sql.bindparams(sa.bindparam("subscriber_ids"))
    sql = sql.bindparams(sa.bindparam("user_ids"))
    sql = sql.bindparams(sa.bindparam("is_currents"))
    sql = sql.bindparams(sa.bindparam("is_deletes"))

    return (sql, params)

def upgrade():
    env = os.getenv("audius_discprov_env")
    if env != "stage" and env != "prod":
        return
    connection = op.get_bind()
    sql, params = build_sql(True, env)
    connection.execute(sql, params)

def downgrade():
    env = os.getenv("audius_discprov_env")
    if env != "stage" and env != "prod":
        return
    connection = op.get_bind()
    sql, params = build_sql(False, env)
    connection.execute(sql, params)
