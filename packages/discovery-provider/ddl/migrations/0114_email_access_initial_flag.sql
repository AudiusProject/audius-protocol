BEGIN;

DO $$ 
BEGIN 
  -- Check if we're on the right environment using blockhash
  IF NOT EXISTS (
    SELECT *
    FROM "blocks"
    WHERE "blockhash" = '0x65a3243860511ed28a933c3a113dea7df368ad53f721cc9d0034c0c75f996afb'
  ) THEN 
    RAISE NOTICE 'Not running on stage environment, skipping migration...';
    RETURN;
  END IF;

  -- Add is_initial column to email_access table if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'email_access' 
                AND column_name = 'is_initial') THEN
      ALTER TABLE email_access ADD COLUMN is_initial BOOLEAN NOT NULL DEFAULT FALSE;
  END IF;

  -- Create indexes for performance if they don't exist
  CREATE INDEX IF NOT EXISTS idx_email_access_is_initial ON email_access(is_initial);
  CREATE INDEX IF NOT EXISTS idx_email_access_email_owner ON email_access(email_owner_user_id);

  -- Check whether the data has already been backfilled and return early for idempotency
  IF EXISTS (
    SELECT 1 
    FROM encrypted_emails ee
    JOIN email_access ea ON ee.email_owner_user_id = ea.email_owner_user_id
    WHERE ea.is_initial = true
    LIMIT 1
  ) THEN 
    RAISE NOTICE 'Backfill already completed, skipping...';
    RETURN;
  END IF;

  -- ========== EMAIL ENCRYPTION BACKFILL ==========
  
  -- Insert encrypted emails (skip duplicates)
  INSERT INTO encrypted_emails (
    email_owner_user_id,
    encrypted_email,
    created_at,
    updated_at
  )
  SELECT DISTINCT ON (CAST(email_owner_id AS INTEGER))
    CAST(email_owner_id AS INTEGER),
    encrypted_email,
    NOW(),
    NOW()
  FROM temp_temp_email_backfill_stage
  ON CONFLICT (email_owner_user_id) DO UPDATE 
  SET encrypted_email = EXCLUDED.encrypted_email,
      updated_at = NOW();

  -- Insert access grants for owners
  INSERT INTO email_access (
    email_owner_user_id,
    receiving_user_id,
    grantor_user_id,
    encrypted_key,
    is_initial,
    created_at,
    updated_at
  )
  SELECT DISTINCT ON (CAST(t.email_owner_id AS INTEGER))
    CAST(t.email_owner_id AS INTEGER),
    CAST(t.email_owner_id AS INTEGER),  -- owner receives their own key
    CAST(t.email_owner_id AS INTEGER),  -- owner grants to themselves
    t.encrypted_key_owner,
    true as is_initial,
    NOW(),
    NOW()
  FROM temp_temp_email_backfill_stage t
  ON CONFLICT (email_owner_user_id, receiving_user_id, grantor_user_id) DO UPDATE 
  SET encrypted_key = EXCLUDED.encrypted_key,
      is_initial = true,
      updated_at = NOW();

  -- Insert access grants for sellers
  INSERT INTO email_access (
    email_owner_user_id,
    receiving_user_id,
    grantor_user_id,
    encrypted_key,
    is_initial,
    created_at,
    updated_at
  )
  SELECT DISTINCT ON (CAST(t.email_owner_id AS INTEGER), CAST(t.seller_id AS INTEGER))
    CAST(t.email_owner_id AS INTEGER),
    CAST(t.seller_id AS INTEGER),
    CAST(t.email_owner_id AS INTEGER),  -- owner grants to seller
    t.encrypted_key_seller,
    true as is_initial,
    NOW(),
    NOW()
  FROM temp_temp_email_backfill_stage t
  ON CONFLICT (email_owner_user_id, receiving_user_id, grantor_user_id) DO UPDATE 
  SET encrypted_key = EXCLUDED.encrypted_key,
      is_initial = true,
      updated_at = NOW();

  -- Insert access grants for grantees
  WITH RECURSIVE split_grantees AS (
    SELECT DISTINCT ON (
      CAST(email_owner_id AS INTEGER),
      CAST(seller_id AS INTEGER),
      CAST(unnest(string_to_array(grantee_ids, ',')) AS INTEGER)
    )
      CAST(email_owner_id AS INTEGER) as email_owner_id,
      CAST(seller_id AS INTEGER) as seller_id,
      grantee_ids,
      encrypted_key_grantees,
      unnest(string_to_array(grantee_ids, ',')) as grantee_id,
      unnest(string_to_array(encrypted_key_grantees, ',')) as encrypted_key
    FROM temp_temp_email_backfill_stage
    WHERE grantee_ids IS NOT NULL
      AND encrypted_key_grantees IS NOT NULL
  )
  INSERT INTO email_access (
    email_owner_user_id,
    receiving_user_id,
    grantor_user_id,
    encrypted_key,
    is_initial,
    created_at,
    updated_at
  )
  SELECT
    email_owner_id,
    CAST(grantee_id AS INTEGER),
    seller_id,  -- seller grants to their managers
    encrypted_key,
    true as is_initial,
    NOW(),
    NOW()
  FROM split_grantees
  ON CONFLICT (email_owner_user_id, receiving_user_id, grantor_user_id) DO UPDATE 
  SET encrypted_key = EXCLUDED.encrypted_key,
      is_initial = true,
      updated_at = NOW();

  RAISE NOTICE 'Backfill completed successfully';
END $$;

COMMIT; 
