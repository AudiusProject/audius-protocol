"""add_safe_to_date_func

Creates a func `to_date_safe` that behaves like `to_date` except
NULL and empty-string input value are coerced to a NULL response rather
than throwing an exception.

Revision ID: f82eb376f471
Revises: 6d1b38f242fe
Create Date: 2020-12-23 18:54:29.965280

"""
from alembic import op


# revision identifiers, used by Alembic.
revision = "f82eb376f471"
down_revision = "6d1b38f242fe"
branch_labels = None
depends_on = None


def upgrade():
    connection = op.get_bind()
    connection.execute(
        """
        CREATE OR REPLACE FUNCTION to_date_safe(p_date VARCHAR, p_format VARCHAR)
        RETURNS DATE
        LANGUAGE plpgsql
        as $$
        DECLARE
            ret_date DATE;
        BEGIN
            IF p_date = '' THEN
                RETURN NULL;
            END IF;
            RETURN to_date( p_date, p_format );
        EXCEPTION
        WHEN others THEN
            RETURN null;
        END;
        $$
        """
    )


def downgrade():
    connection = op.get_bind()
    connection.execute(
        """
        DROP FUNCTION to_date_safe;
        """
    )
