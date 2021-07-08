"""reasdf

Revision ID: 61a2ec64d2cb
Revises: 6a97af9e5058
Create Date: 2019-12-24 11:53:04.267648

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "61a2ec64d2cb"
down_revision = "6a97af9e5058"
branch_labels = None
depends_on = None


# Add col to search views to remove inner join in search queries.
def upgrade():
    connection = op.get_bind()
    connection.execute(
        """
      --- Add "name" field to user_lexeme_dict.
      
      DROP MATERIALIZED VIEW user_lexeme_dict;
      DROP INDEX IF EXISTS user_words_idx;
      CREATE MATERIALIZED VIEW user_lexeme_dict as
      SELECT * FROM (
        SELECT
          u.user_id,
          u.name as user_name,
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
        WHERE u.is_current = true
        GROUP BY u.user_id, u.name, u.handle
      ) AS words;
      CREATE INDEX user_words_idx ON user_lexeme_dict USING gin(word gin_trgm_ops);


      --- Add "title" field to track_lexeme_dict.

      DROP MATERIALIZED VIEW track_lexeme_dict;
      DROP INDEX IF EXISTS track_words_idx;
      CREATE MATERIALIZED VIEW track_lexeme_dict as
      SELECT * FROM (
        SELECT
          t.track_id,
          t.title as track_title,
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
        WHERE
          t.is_current = true and t.is_unlisted = false
          and u.is_current = true
        GROUP BY t.track_id, t.title
      ) AS words;
      CREATE INDEX track_words_idx ON track_lexeme_dict USING gin(word gin_trgm_ops);


      --- Add "playlist_name" field to playlist_lexeme_dict and album_lexeme_dict;

      DROP MATERIALIZED VIEW playlist_lexeme_dict;
      DROP MATERIALIZED VIEW album_lexeme_dict;
      DROP INDEX IF EXISTS playlist_words_idx;
      DROP INDEX IF EXISTS album_words_idx;
      CREATE MATERIALIZED VIEW playlist_lexeme_dict as
      SELECT * FROM (
        SELECT
          p.playlist_id,
          p.playlist_name,
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
        WHERE
            p.is_current = true and p.is_album = false and p.is_private = false
            and u.is_current = true
        GROUP BY p.playlist_id, p.playlist_name
      ) AS words;
      CREATE MATERIALIZED VIEW album_lexeme_dict as
      SELECT * FROM (
        SELECT
          p.playlist_id,
          p.playlist_name,
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
        WHERE
            p.is_current = true and p.is_album = true and p.is_private = false
            and u.is_current = true
        GROUP BY p.playlist_id, p.playlist_name
      ) AS words;
      CREATE INDEX playlist_words_idx ON playlist_lexeme_dict USING gin(word gin_trgm_ops);
      CREATE INDEX album_words_idx ON album_lexeme_dict USING gin(word gin_trgm_ops);
    """
    )


def downgrade():
    pass
