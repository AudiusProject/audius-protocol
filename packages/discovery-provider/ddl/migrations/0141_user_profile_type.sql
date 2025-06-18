-- add profile_type_enum if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'profile_type_enum') THEN
    CREATE TYPE profile_type_enum AS ENUM ('label');
  END IF;
END$$;

-- Add users.profile_type if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name='users' AND column_name='profile_type'
  ) THEN
    ALTER TABLE users ADD COLUMN profile_type profile_type_enum;
  END IF;
END$$;
