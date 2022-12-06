"""backfill_track_cid
Revision ID: 2fad3671bf9f
Revises: f91c041d1d8d
Create Date: 2022-10-27 02:14:19.935610
"""
import os

# import urllib.request
import zipfile
from pathlib import Path

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.types import Integer, String

# revision identifiers, used by Alembic.
# revision = '2fad3671bf9f'
# down_revision = 'f91c041d1d8d'
branch_labels = None
depends_on = None


def build_sql(up, env):
    if env == "stage":
        path = Path(__file__).parent.joinpath("./final_boss_stage.csv")
    elif env == "prod":
        path = Path(__file__).parent.joinpath("./final_boss.csv")

    with open(path, "r") as f:
        track_cids = []
        track_ids = []
        for entry in f:
            track_id, track_cid = entry.split(",")

            if up:
                track_id = int(track_id.strip())
                track_ids.append(track_id)
                track_cids.append(track_cid)

    params = {
        "track_cids": track_cids,
        "track_ids": track_ids,
    }
    if up:
        inner_sql = "UPDATE track SET track_cid = data_table.track_cid WHERE users.is_current = True AND users.track_id = data_table.track_id;"
    else:
        inner_sql = "UPDATE track SET track_cid = null WHERE users.is_current = True AND users.track_id = data_table.track_id;"

    sql = sa.text("begin; \n\n " + inner_sql + " \n\n commit;")
    sql = sql.bindparams(sa.bindparam("track_cids", ARRAY(String)))
    if up:
        sql = sql.bindparams(sa.bindparam("track_ids", ARRAY(Integer)))

    return (sql, params)


def upgrade():
    # env = os.getenv("audius_discprov_env")
    # if env != "stage" and env != "prod":
    #     return
    # connection = op.get_bind()
    # sql, params = build_sql(True, env)
    # connection.execute(sql, params)

    path_tmp = Path(__file__).parent.joinpath("../tmp")
    path_csv = Path(__file__).parent.joinpath("../tmp/track_cids.csv")
    path_zip = Path(__file__).parent.joinpath("../tmp/track_cids.csv.zip")

    # if we want to download from s3 rather than check in the csv zip in the code
    # then uncomment below
    # os.mkdir(path_tmp)
    # aws_url = "https://s3.us-west-1.amazonaws.com/download.audius.co/track_cids.csv.zip"
    # print(f"Migration - downloading {aws_url}")
    # urllib.request.urlretrieve(aws_url, path_zip)
    # print("Migration - download complete")

    with zipfile.ZipFile(path_zip, "r") as zip_ref:
        zip_ref.extractall(path_tmp)

    cursor = op.get_bind().connection.cursor()
    with open(path_csv, "r") as f:
        cursor.copy_from(f, "yolo", sep=",")

    os.remove(path_csv)
    # if we downloaded from s3 rather than use checked in csv zip in the code
    # then uncomment below
    # os.remove(path_zip)
    # os.rmdir(path_tmp)


def downgrade():
    # env = os.getenv("audius_discprov_env")
    # if env != "stage" and env != "prod":
    #     return
    # connection = op.get_bind()
    # sql, params = build_sql(False, env)
    # connection.execute(sql, params)
    pass
