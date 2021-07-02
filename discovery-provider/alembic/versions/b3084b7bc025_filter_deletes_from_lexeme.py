"""filter deletes from lexeme

Revision ID: b3084b7bc025
Revises: 61a2ec64d2cb
Create Date: 2020-02-20 10:49:50.076846

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "b3084b7bc025"
down_revision = "61a2ec64d2cb"
branch_labels = None
depends_on = None


# Filter out deleted items from lexeme dictionary
# The client filters these out and can show incorrect counts of search results
# because of it.
def upgrade():
    connection = op.get_bind()
    connection.execute(
        """
      --- Filter deletes from track_lexeme_dict.

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
          t.is_current = true and
          t.is_unlisted = false and
          t.is_delete = false and
          u.is_current = true
        GROUP BY t.track_id, t.title
      ) AS words;
      CREATE INDEX track_words_idx ON track_lexeme_dict USING gin(word gin_trgm_ops);


      --- Filter deletes from playlist_lexeme_dict and album_lexeme_dict.

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
            p.is_current = true and
            p.is_album = false and
            p.is_private = false and
            p.is_delete = false and
            u.is_current = true
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
            p.is_current = true and
            p.is_album = true and
            p.is_private = false and
            p.is_delete = false and
            u.is_current = true
        GROUP BY p.playlist_id, p.playlist_name
      ) AS words;
      CREATE INDEX playlist_words_idx ON playlist_lexeme_dict USING gin(word gin_trgm_ops);
      CREATE INDEX album_words_idx ON album_lexeme_dict USING gin(word gin_trgm_ops);
    """
    )


def downgrade():
    pass
