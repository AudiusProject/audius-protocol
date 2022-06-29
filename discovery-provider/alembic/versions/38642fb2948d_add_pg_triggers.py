"""add pg trigger for aggregate plays

This migration updates the DB to use a pg trigger to update the
aggregate_plays table instead of using a celery task
1. Update the aggreagate_plays table to be up to date
   This provides consistency and is a precursor to updating
   the table via pg triggers
2. Create the handle_play function to increment the play item's count
3. Register the function as a pg trigger on insert to plays table

Revision ID: 38642fb2948d
Revises: cdf1f6197fc6
Create Date: 2022-06-13 20:28:06.487553

"""
from alembic import op

# revision identifiers, used by Alembic.
revision = "38642fb2948d"
down_revision = "cdf1f6197fc6"
branch_labels = None
depends_on = None


def upgrade():
    connection = op.get_bind()
    connection.execute(
        """
        SELECT pg_cancel_backend(pid)
        FROM pg_stat_activity 
        WHERE state != 'idle' AND query NOT ILIKE '%pg_stat_activity%' and pid <> pg_backend_pid() 
        ORDER BY query_start DESC;
        
        begin;
            WITH new_plays AS (
                SELECT
                    play_item_id,
                    count(play_item_id) AS count
                FROM
                    plays p
                WHERE
                    p.id > (select last_checkpoint from indexing_checkpoints where tablename='aggregate_plays')
                GROUP BY
                    play_item_id
            )
            INSERT INTO
                aggregate_plays (play_item_id, count)
            SELECT
                new_plays.play_item_id,
                new_plays.count
            FROM
                new_plays ON CONFLICT (play_item_id) DO
            UPDATE
            SET
                count = aggregate_plays.count + EXCLUDED.count;

            -- Create the update plays trigger
            create or replace function handle_play() returns trigger as $$
            declare
                new_listen_count int;
                milestone int;
            begin

                insert into aggregate_plays (play_item_id, count) values (new.play_item_id, 0) on conflict do nothing;

                update aggregate_plays
                    set count = count + 1 
                    where play_item_id = new.play_item_id
                    returning count into new_listen_count;

                select new_listen_count 
                    into milestone 
                    where new_listen_count in (10,25,50,100,250,500,1000,5000,10000,20000,50000,100000,1000000);

                if milestone is not null then
                    insert into milestones
                        (id, name, threshold, slot, timestamp)
                    values
                        (new.play_item_id, 'LISTEN_COUNT', milestone, new.slot, new.created_at)
                    on conflict do nothing;
                end if;
                return null;
            end; 
            $$ language plpgsql;

            drop trigger if exists on_play on plays;
            create trigger on_play
                after insert on plays
                for each row execute procedure handle_play();
        commit;
    """
    )


def downgrade():
    connection = op.get_bind()
    connection.execute("drop trigger if exists on_play on plays;")
