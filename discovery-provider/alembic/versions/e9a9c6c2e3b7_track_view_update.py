"""track view update

Revision ID: e9a9c6c2e3b7
Revises: 3acec9065c7f
Create Date: 2019-09-06 10:55:19.835973

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "e9a9c6c2e3b7"
down_revision = "3acec9065c7f"
branch_labels = None
depends_on = None


def upgrade():
    connection = op.get_bind()
    connection.execute(
        """
        --- Update track_lexeme_dict to exclude tags as part of search
        DROP MATERIALIZED VIEW track_lexeme_dict;
        DROP INDEX IF EXISTS track_words_idx;
        CREATE MATERIALIZED VIEW track_lexeme_dict as
        SELECT * FROM (
        SELECT
          t.track_id,
          unnest(tsvector_to_array(to_tsvector('audius_ts_config', replace(COALESCE(t."title", ''), '&', 'and'))))
            as word
        FROM
            "tracks" t
        INNER JOIN "users" u ON t."owner_id" = u."user_id"
        WHERE t."is_current" = true and u."is_ready" = true and u."is_current" = true
        GROUP BY t."track_id", t."title", t."tags"
        ) AS words;
      
       -- add index on above materialized view
       CREATE INDEX track_words_idx ON track_lexeme_dict USING gin(word gin_trgm_ops);
    """
    )
    # ### end Alembic commands ###


def downgrade():
    pass
    # ### end Alembic commands ###
