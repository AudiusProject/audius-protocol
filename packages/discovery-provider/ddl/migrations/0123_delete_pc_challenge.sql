BEGIN;

DO $$ 
BEGIN 
  -- Check if we're on the stage environment using blockhash
  IF EXISTS (
    SELECT *
    FROM "blocks"
    WHERE "blockhash" = '0x65a3243860511ed28a933c3a113dea7df368ad53f721cc9d0034c0c75f996afb'
  ) THEN 
    -- Delete all user challenges with challenge_id = 'pc' only on stage
    DELETE FROM user_challenges WHERE challenge_id = 'pc';
  END IF;
END $$;

COMMIT;
