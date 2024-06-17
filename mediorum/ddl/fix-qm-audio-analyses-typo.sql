begin;
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'qm_audio_analyses' 
          AND column_name = 'c_id'
    ) THEN
        ALTER TABLE qm_audio_analyses DROP COLUMN c_id;
    END IF;
END $$;
commit;
