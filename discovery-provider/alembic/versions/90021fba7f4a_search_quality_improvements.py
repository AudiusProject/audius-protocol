"""search_quality_improvements

Revision ID: 90021fba7f4a
Revises: 5bcbe23f6c70
Create Date: 2021-04-21 00:31:25.072811

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '90021fba7f4a'
down_revision = '5bcbe23f6c70'
branch_labels = None
depends_on = None


def upgrade():
    connection = op.get_bind()
    connection.execute('''

    DROP MATERIALIZED VIEW IF EXISTS user_lexeme_dict;
    DROP INDEX IF EXISTS user_words_idx;

    CREATE MATERIALIZED VIEW user_lexeme_dict as
    SELECT row_number() OVER (PARTITION BY true), * FROM (
        SELECT
            u.user_id,
            lower(u.name) as user_name,
            lower(u.handle) as handle,
            a.follower_count as follower_count,
            unnest(
                tsvector_to_array(
                    to_tsvector(
                        'audius_ts_config',
                        replace(COALESCE(u.name, ''), '&', 'and')
                    ) ||
                    to_tsvector(
                        'audius_ts_config',
                        COALESCE(u.handle, '')
                    )
                )
            ) as word
        FROM
            users u
        INNER JOIN aggregate_user a on a.user_id = u.user_id
        WHERE u.is_current = true and 
        u.user_id not in (
			select u.user_id from users u
			inner join
				(
					select distinct lower(u1.handle) as handle, u1.user_id from users u1
					where u1.is_current = true and u1.is_verified = true
				) as sq
			on lower(u.name) = sq.handle and u.user_id != sq.user_id
			where u.is_current = true
		)
        GROUP BY u.user_id, u.name, u.handle, a.follower_count
    ) AS words;

    CREATE INDEX user_words_idx ON user_lexeme_dict USING gin(word gin_trgm_ops);
    CREATE INDEX user_handles_idx ON user_lexeme_dict(handle); 
    CREATE UNIQUE INDEX user_row_number_idx ON user_lexeme_dict(row_number);

    DROP MATERIALIZED VIEW IF EXISTS track_lexeme_dict;
    DROP INDEX IF EXISTS track_words_idx;

    CREATE MATERIALIZED VIEW track_lexeme_dict as
    SELECT row_number() OVER (PARTITION BY true), * FROM (
        SELECT
            t.track_id,
            t.owner_id as owner_id,
            lower(t.title) as track_title,
            lower(u.handle) as handle,
            lower(u.name) as user_name,
            a.repost_count as repost_count,
            unnest(
                tsvector_to_array(
                    to_tsvector(
                        'audius_ts_config',
                        replace(COALESCE(t."title", ''), '&', 'and')
                    )
                )
            ) as word
        FROM
            tracks t
        INNER JOIN users u ON t.owner_id = u.user_id
        INNER JOIN aggregate_track a on a.track_id = t.track_id
        WHERE t.is_current = true AND t.is_unlisted = false AND t.is_delete = false AND t.stem_of IS NULL AND u.is_current = true and
        u.user_id not in (
			select u.user_id from users u
			inner join
				(
					select distinct lower(u1.handle) as handle, u1.user_id from users u1
					where u1.is_current = true and u1.is_verified = true
				) as sq
			on lower(u.name) = sq.handle and u.user_id != sq.user_id
			where u.is_current = true
		)
        GROUP BY t.track_id, t.title, t.owner_id, u.handle, u.name, a.repost_count
    ) AS words;

    CREATE INDEX track_words_idx ON track_lexeme_dict USING gin(word gin_trgm_ops);
    CREATE INDEX track_user_name_idx ON track_lexeme_dict USING gin(user_name gin_trgm_ops);
    CREATE INDEX tracks_user_handle_idx ON track_lexeme_dict(handle);
    CREATE UNIQUE INDEX track_row_number_idx ON track_lexeme_dict(row_number);

    DROP MATERIALIZED VIEW IF EXISTS playlist_lexeme_dict;
    DROP MATERIALIZED VIEW IF EXISTS album_lexeme_dict;
    DROP INDEX IF EXISTS playlist_words_idx;
    DROP INDEX IF EXISTS album_words_idx;

    CREATE MATERIALIZED VIEW playlist_lexeme_dict as
    SELECT row_number() OVER (PARTITION BY true), * FROM (
        SELECT
            p.playlist_id,
            lower(p.playlist_name) as playlist_name,
            p.playlist_owner_id as owner_id,
            lower(u.handle) as handle,
            lower(u.name) as user_name,
            a.repost_count as repost_count,
            unnest(
                tsvector_to_array(
                    to_tsvector(
                        'audius_ts_config',
                        replace(COALESCE(p.playlist_name, ''), '&', 'and')
                    )
                )
            ) as word
        FROM
                playlists p
        INNER JOIN users u ON p.playlist_owner_id = u.user_id
        INNER JOIN aggregate_playlist a on a.playlist_id = p.playlist_id
        WHERE
                p.is_current = true and p.is_album = false and p.is_private = false and p.is_delete = false
                and u.is_current = true and 
                u.user_id not in (
                    select u.user_id from users u
                    inner join
                        (
                            select distinct lower(u1.handle) as handle, u1.user_id from users u1
                            where u1.is_current = true and u1.is_verified = true
                        ) as sq
                    on lower(u.name) = sq.handle and u.user_id != sq.user_id
                    where u.is_current = true
                )
        GROUP BY p.playlist_id, p.playlist_name, p.playlist_owner_id, u.handle, u.name, a.repost_count
    ) AS words;

    CREATE MATERIALIZED VIEW album_lexeme_dict as
    SELECT row_number() OVER (PARTITION BY true), * FROM (
        SELECT
            p.playlist_id,
            lower(p.playlist_name) as playlist_name,
            p.playlist_owner_id as owner_id,
            lower(u.handle) as handle,
            lower(u.name) as user_name,
            a.repost_count as repost_count,
            unnest(
                tsvector_to_array(
                    to_tsvector(
                        'audius_ts_config',
                        replace(COALESCE(p.playlist_name, ''), '&', 'and')
                    )
                )
            ) as word
        FROM
                playlists p
        INNER JOIN users u ON p.playlist_owner_id = u.user_id
        INNER JOIN aggregate_playlist a on a.playlist_id = p.playlist_id
        WHERE
                p.is_current = true and p.is_album = true and p.is_private = false and p.is_delete = false
                and u.is_current = true and
                u.user_id not in (
                    select u.user_id from users u
                    inner join
                        (
                            select distinct lower(u1.handle) as handle, u1.user_id from users u1
                            where u1.is_current = true and u1.is_verified = true
                        ) as sq
                    on lower(u.name) = sq.handle and u.user_id != sq.user_id
                    where u.is_current = true
                )
        GROUP BY p.playlist_id, p.playlist_name, p.playlist_owner_id, u.handle, u.name, a.repost_count
    ) AS words;

    CREATE INDEX playlist_words_idx ON playlist_lexeme_dict USING gin(word gin_trgm_ops);
    CREATE INDEX playlist_user_name_idx ON playlist_lexeme_dict USING gin(user_name gin_trgm_ops);
    CREATE INDEX playlist_user_handle_idx ON playlist_lexeme_dict(handle);
    CREATE UNIQUE INDEX playlist_row_number_idx ON playlist_lexeme_dict(row_number);

    CREATE INDEX album_words_idx ON album_lexeme_dict USING gin(word gin_trgm_ops);
    CREATE INDEX album_user_name_idx ON album_lexeme_dict USING gin(user_name gin_trgm_ops);
    CREATE INDEX album_user_handle_idx ON album_lexeme_dict(handle);
    CREATE UNIQUE INDEX album_row_number_idx ON album_lexeme_dict(row_number);
    '''
    )


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    pass
    # ### end Alembic commands ###
