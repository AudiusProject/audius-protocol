BEGIN;

DO $$ 
BEGIN 

  -- Add is_initial column to email_access table if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'email_access' 
                AND column_name = 'is_initial') THEN
      ALTER TABLE email_access ADD COLUMN is_initial BOOLEAN NOT NULL DEFAULT FALSE;
  END IF;

END $$;

COMMIT;
