"""backfill_track_cid

Revision ID: ec3b20d7bce3
Revises: 7b843f2d3a0d
Create Date: 2022-12-08 14:34:59.163989

"""
import os
import shutil
import urllib.request
import zipfile
from pathlib import Path

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import ARRAY

# revision identifiers, used by Alembic.
revision = "ec3b20d7bce3"
down_revision = "7b843f2d3a0d"
branch_labels = None
depends_on = None


def copy_mapping_into_temp_table():
    ####################################################################
    # Create temporary table and copy track id <> cid mapping into table
    # Also create index on track_id
    ####################################################################
    inner_sql = f"""
        create table if not exists tmp_track_cid_mapping (track_id varchar unique, track_cid varchar(46));
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
        aws_url = (
            "https://s3.us-west-1.amazonaws.com/download.audius.co/track_cids.csv.zip"
        )

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
        alter table tmp_track_cid_mapping alter column track_id type integer using track_id::int;
        create index if not exists tmp_track_cid_mapping_idx on tmp_track_cid_mapping USING btree (track_id);
        """
    sql = sa.text("begin; \n\n " + inner_sql + " \n\n commit;")
    op.get_bind().execute(sql)

    os.remove(path_csv)
    os.remove(path_zip)
    shutil.rmtree(path_tmp, ignore_errors=True)


def remove_temp_table():
    # Drop index then table
    inner_sql = f"""
        drop index if exists tmp_track_cid_mapping_idx;
        drop table if exists tmp_track_cid_mapping;
        """
    sql = sa.text("begin; \n\n " + inner_sql + " \n\n commit;")
    op.get_bind().execute(sql)


def remove_track_triggers():
    inner_sql = f"""
        drop trigger if exists on_track on tracks;
        drop trigger if exists trg_tracks on tracks;
        """
    sql = sa.text("begin; \n\n " + inner_sql + " \n\n commit;")
    op.get_bind().execute(sql)


def restore_track_triggers():
    inner_sql = f"""
        create or replace function handle_track() returns trigger as $$
        declare
        old_row tracks%ROWTYPE;
        new_val int;
        delta int := 0;
        parent_track_owner_id int;
        begin
        insert into aggregate_track (track_id) values (new.track_id) on conflict do nothing;
        insert into aggregate_user (user_id) values (new.owner_id) on conflict do nothing;

        update aggregate_user
        set track_count = (
            select count(*)
            from tracks t
            where t.is_current is true
            and t.is_delete is false
            and t.is_unlisted is false
            and t.is_available is true
            and t.stem_of is null
            and t.owner_id = new.owner_id
        )
        where user_id = new.owner_id
        ;

        -- If remix, create notification
        begin
            if new.remix_of is not null AND new.is_unlisted = FALSE and new.is_available = true AND new.is_delete = FALSE AND new.stem_of IS NULL then
            select owner_id into parent_track_owner_id from tracks where is_current and track_id = (new.remix_of->'tracks'->0->>'parent_track_id')::int limit 1;
            if parent_track_owner_id is not null then
                insert into notification
                (blocknumber, user_ids, timestamp, type, specifier, group_id, data)
                values
                (
                new.blocknumber,
                ARRAY [parent_track_owner_id],
                new.updated_at,
                'remix',
                new.owner_id,
                'remix:track:' || new.track_id || ':parent_track:' || (new.remix_of->'tracks'->0->>'parent_track_id')::int || ':blocknumber:' || new.blocknumber,
                json_build_object('track_id', new.track_id, 'parent_track_id', (new.remix_of->'tracks'->0->>'parent_track_id')::int)
                )
                on conflict do nothing;
            end if;
            end if;
            exception
                when others then null;
            end;

        return null;
        end;
        $$ language plpgsql;

        create trigger on_track
        after insert or update on tracks
        for each row execute procedure handle_track();



        create or replace function on_new_row() returns trigger as $$
        begin
            PERFORM pg_notify(TG_TABLE_NAME, json_build_object('track_id', new.track_id)::text);
            return null;
        end;
        $$ language plpgsql;

        create trigger trg_tracks
        after insert or update on tracks
        for each row execute procedure on_new_row();
        """
    sql = sa.text("begin; \n\n " + inner_sql + " \n\n commit;")
    op.get_bind().execute(sql)


def upgrade():
    copy_mapping_into_temp_table()
    remove_track_triggers()

    ###############################################################
    # Update the tracks table using the new temporary mapping table
    ###############################################################
    inner_sql = f"""
        update tracks set track_cid = sub.track_cid
        from tmp_track_cid_mapping as sub
        where tracks.track_id = sub.track_id
        and tracks.is_current is true;
        """
    sql = sa.text("begin; \n\n " + inner_sql + " \n\n commit;")
    op.get_bind().execute(sql)

    restore_track_triggers()
    remove_temp_table()


def downgrade():
    copy_mapping_into_temp_table()
    remove_track_triggers()

    ################################################################################
    # Update the tracks table by setting track cid to null for tracks in the mapping
    ################################################################################
    inner_sql = f"""
        update tracks set track_cid = null
        from tmp_track_cid_mapping as sub
        where tracks.track_id = sub.track_id
        and tracks.is_current is true;
        """
    sql = sa.text("begin; \n\n " + inner_sql + " \n\n commit;")
    op.get_bind().execute(sql)

    restore_track_triggers()
    remove_temp_table()
