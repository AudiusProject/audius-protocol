-- cleanup keys and indices with is_current
begin;

CREATE OR REPLACE FUNCTION delete_constraints_referencing_blocks()
RETURNS void AS
$$
DECLARE
    constraint_record RECORD;
BEGIN
    FOR constraint_record IN (
        SELECT
            c.conname AS constraint_name,
            conrelid::regclass AS referencing_table
        FROM
            pg_constraint c
        JOIN
            pg_attribute a ON a.attnum = ANY(c.conkey)
        WHERE
            confrelid = 'blocks'::regclass
            AND contype = 'f'
            AND pg_get_constraintdef(c.oid) NOT LIKE '%ON DELETE CASCADE%'
        GROUP BY
            c.conname, conrelid::regclass
    )
    LOOP
        -- Drop the foreign key constraint
        EXECUTE 'ALTER TABLE ' || constraint_record.referencing_table || ' DROP CONSTRAINT ' || constraint_record.constraint_name;
    END LOOP;
END;
$$
LANGUAGE plpgsql;

select delete_constraints_referencing_blocks();

commit;