"""backfill_track_cid

Revision ID: ec3b20d7bce3
Revises: fe2c3daaa912
Create Date: 2022-12-08 14:34:59.163989

"""
import os
import shutil
import urllib.request
import zipfile
from pathlib import Path

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "ec3b20d7bce3"
down_revision = "fe2c3daaa912"
branch_labels = None
depends_on = None


def copy_mapping_into_temp_table():
    ####################################################################
    # Create temporary table and copy track id <> cid mapping into table
    # Also create index on track_id
    ####################################################################
    try:
        inner_sql = f"""
            drop table if exists tmp_track_cid_mapping;
            create table if not exists tmp_track_cid_mapping (track_id integer unique, track_cid varchar(46));
            """
        sql = sa.text("begin; \n\n " + inner_sql + " \n\n commit;")
        op.get_bind().execute(sql)

        path_tmp = Path(__file__).parent.joinpath("../tmp")
        path_csv = Path(__file__).parent.joinpath("../tmp/track_cids.csv")
        path_zip = Path(__file__).parent.joinpath("../tmp/track_cids.csv.zip")

        env = os.getenv("audius_discprov_env")
        if env != "stage" and env != "prod":
            return
        if env == "stage":
            aws_url = "https://s3.us-west-1.amazonaws.com/download.staging.audius.co/track_cids.csv.zip"
        else:
            aws_url = "https://s3.us-west-1.amazonaws.com/download.audius.co/track_cids.csv.zip"

        if os.path.isdir(path_tmp):
            shutil.rmtree(path_tmp)
        os.mkdir(path_tmp)
        print(f"Migration - downloading {aws_url}")
        urllib.request.urlretrieve(aws_url, path_zip)
        print("Migration - download complete")

        with zipfile.ZipFile(path_zip, "r") as zip_ref:
            zip_ref.extractall(path_tmp)

        cursor = op.get_bind().connection.cursor()
        with open(path_csv, "r") as f:
            # Skip the header row of the csv
            next(f)
            cursor.copy_from(
                f, "tmp_track_cid_mapping", sep=",", columns=("track_id", "track_cid")
            )

        #############################################################
        # Change the track id column type to be integer and add index
        #############################################################
        inner_sql = f"""
            create index if not exists tmp_track_cid_mapping_idx on tmp_track_cid_mapping USING btree (track_id);
            """
        sql = sa.text("begin; \n\n " + inner_sql + " \n\n commit;")
        op.get_bind().execute(sql)
    finally:
        if os.path.isdir(path_tmp):
            shutil.rmtree(path_tmp)


def remove_temp_table():
    # Drop index then table
    inner_sql = f"""
        drop index if exists tmp_track_cid_mapping_idx;
        drop table if exists tmp_track_cid_mapping;
        """
    sql = sa.text("begin; \n\n " + inner_sql + " \n\n commit;")
    op.get_bind().execute(sql)


def disable_track_triggers():
    inner_sql = f"""
        alter table tracks disable trigger on_track;
        DO $$
        BEGIN
            IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_tracks') THEN
                alter table tracks disable trigger trg_tracks;
            END IF;
        END
        $$;
        """
    sql = sa.text("begin; \n\n " + inner_sql + " \n\n commit;")
    op.get_bind().execute(sql)


def enable_track_triggers():
    inner_sql = f"""
        alter table tracks enable trigger on_track;
        DO $$
        BEGIN
            IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_tracks') THEN
                alter table tracks disable trigger trg_tracks;
            END IF;
        END
        $$;
        """
    sql = sa.text("begin; \n\n " + inner_sql + " \n\n commit;")
    op.get_bind().execute(sql)


def upgrade():
    remove_temp_table()
    copy_mapping_into_temp_table()
    disable_track_triggers()

    ###############################################################
    # Update the tracks table using the new temporary mapping table
    ###############################################################
    inner_sql = f"""
        update tracks set track_cid = sub.track_cid
        from tmp_track_cid_mapping as sub
        where tracks.track_id = sub.track_id;
        """
    sql = sa.text("begin; \n\n " + inner_sql + " \n\n commit;")
    op.get_bind().execute(sql)

    enable_track_triggers()
    remove_temp_table()


def downgrade():
    remove_temp_table()
    copy_mapping_into_temp_table()
    disable_track_triggers()

    ################################################################################
    # Update the tracks table by setting track cid to null for tracks in the mapping
    ################################################################################
    inner_sql = f"""
        update tracks set track_cid = null
        from tmp_track_cid_mapping as sub
        where tracks.track_id = sub.track_id;
        """
    sql = sa.text("begin; \n\n " + inner_sql + " \n\n commit;")
    op.get_bind().execute(sql)

    enable_track_triggers()
    remove_temp_table()
