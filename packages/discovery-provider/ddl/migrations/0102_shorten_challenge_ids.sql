/** 
 * Migrates our existing challenge IDs to shorter ones, and moves specifiers to 
 * hex values so that they are shorter (when stringified) too.
 * This allows us to put challenge claims into single Solana transactions as
 * the disbursement IDs need to be less than 21 bytes.
 * 
 * This migration turns off triggers, drops indexes, and drops pkey constraints
 * to increase speed, and carefully readds them in the end.
**/

BEGIN;

/* CHALLENGES */

-- remove foreign key
ALTER TABLE user_challenges DROP CONSTRAINT user_challenges_challenge_id_fkey;

-- Update challenges table
UPDATE challenges SET id = 'p' WHERE id = 'profile-completion';
UPDATE challenges SET id = 'l' WHERE id = 'listen-streak';
UPDATE challenges SET id = 'u' WHERE id = 'track-upload';
UPDATE challenges SET id = 'r' WHERE id = 'referrals';
UPDATE challenges SET id = 'rv' WHERE id = 'ref-v';
UPDATE challenges SET id = 'rd' WHERE id = 'referred';
UPDATE challenges SET id = 'v' WHERE id = 'connect-verified';
UPDATE challenges SET id = 'm' WHERE id = 'mobile-install';
UPDATE challenges SET id = 'ft' WHERE id = 'send-first-tip';
UPDATE challenges SET id = 'fp' WHERE id = 'first-playlist';

/* USER CHALLENGES */

-- disable trigger (doesn't exist on test db?)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.triggers 
        WHERE event_object_table = 'user_challenges' 
        AND trigger_name = 'on_user_challenge'
    ) THEN
        EXECUTE 'ALTER TABLE user_challenges DISABLE TRIGGER on_user_challenge';
    END IF;
END $$;

-- remove pkey from user_challenges before triggering constraint checks
ALTER TABLE user_challenges DROP CONSTRAINT user_challenges_pkey;

-- remove indexes
DROP INDEX user_challenges_challenge_idx;

-- Update user_challenges, using the challenge id as a filter to ensure idempotency
UPDATE user_challenges 
  SET 
    challenge_id = 'p', 
    specifier = to_hex(specifier::integer)
  WHERE challenge_id = 'profile-completion';

UPDATE user_challenges 
SET 
    challenge_id = 'l', 
    specifier = to_hex(specifier::integer) 
WHERE challenge_id = 'listen-streak';

UPDATE user_challenges 
SET 
    challenge_id = 'u', 
    specifier = to_hex(specifier::integer) 
WHERE challenge_id = 'track-upload';


UPDATE user_challenges 
SET 
    challenge_id = 'rd', 
    specifier = to_hex(specifier::integer) 
WHERE challenge_id = 'referred';

UPDATE user_challenges 
SET 
    challenge_id = 'v', 
    specifier = to_hex(specifier::integer) 
WHERE challenge_id = 'connect-verified';

UPDATE user_challenges 
SET 
    challenge_id = 'm', 
    specifier = to_hex(specifier::integer) 
WHERE challenge_id = 'mobile-install';

UPDATE user_challenges 
SET 
    challenge_id = 'ft', 
    specifier = to_hex(specifier::integer) 
WHERE challenge_id = 'send-first-tip';

UPDATE user_challenges 
SET 
    challenge_id = 'fp', 
    specifier = to_hex(specifier::integer) 
WHERE challenge_id = 'first-playlist';

UPDATE user_challenges 
SET 
    challenge_id = 'r', 
    specifier = 
      to_hex(split_part(specifier, '=>', 1)::integer) || 
      ':' || 
      to_hex(split_part(specifier, '=>', 2)::integer)
WHERE challenge_id = 'referrals';

UPDATE user_challenges 
SET 
    challenge_id = 'rv', 
    specifier = 
      to_hex(split_part(specifier, '=>', 1)::integer) || 
      ':' || 
      to_hex(split_part(specifier, '=>', 2)::integer)
WHERE challenge_id = 'ref-v';

UPDATE user_challenges 
SET
    specifier = 
      to_hex(split_part(specifier, '=>', 1)::integer) || 
      ':' || 
      to_hex(split_part(specifier, '=>', 2)::integer)
WHERE challenge_id = 'b';

UPDATE user_challenges 
SET 
    specifier = 
      to_hex(split_part(specifier, '=>', 1)::integer) || 
      ':' || 
      to_hex(split_part(specifier, '=>', 2)::integer)
WHERE challenge_id = 's';

-- readd index (probably not super necessary since the pkey covers this anyway, but whatevs)
CREATE INDEX user_challenges_challenge_idx ON public.user_challenges USING btree (challenge_id);

-- readd pkey
ALTER TABLE ONLY user_challenges
    ADD CONSTRAINT user_challenges_pkey PRIMARY KEY (challenge_id, specifier);

-- reenable trigger
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.triggers 
        WHERE event_object_table = 'user_challenges' 
        AND trigger_name = 'on_user_challenge'
    ) THEN
        EXECUTE 'ALTER TABLE user_challenges ENABLE TRIGGER on_user_challenge';
    END IF;
END $$;

/* CHALLENGE DISBURSEMENTS */

-- disable trigger (doesn't exist on test db?)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.triggers 
        WHERE event_object_table = 'challenge_disbursements' 
        AND trigger_name = 'on_challenge_disbursement'
    ) THEN
        EXECUTE 'ALTER TABLE challenge_disbursements DISABLE TRIGGER on_challenge_disbursement';
    END IF;
END $$;

-- remove pkey 
ALTER TABLE challenge_disbursements DROP CONSTRAINT challenge_disbursements_pkey;

-- Update challenge_disbursements, using the user_id as a idempotency test
UPDATE challenge_disbursements 
  SET 
    challenge_id = 'p', 
    specifier = to_hex(specifier::integer)
  WHERE challenge_id = 'profile-completion';

UPDATE challenge_disbursements 
SET 
    challenge_id = 'l', 
    specifier = to_hex(specifier::integer) 
WHERE challenge_id = 'listen-streak';

UPDATE challenge_disbursements 
SET 
    challenge_id = 'u', 
    specifier = to_hex(specifier::integer) 
WHERE challenge_id = 'track-upload';


UPDATE challenge_disbursements 
SET 
    challenge_id = 'rd', 
    specifier = to_hex(specifier::integer) 
WHERE challenge_id = 'referred';

UPDATE challenge_disbursements 
SET 
    challenge_id = 'v', 
    specifier = to_hex(specifier::integer) 
WHERE challenge_id = 'connect-verified';

UPDATE challenge_disbursements 
SET 
    challenge_id = 'm', 
    specifier = to_hex(specifier::integer) 
WHERE challenge_id = 'mobile-install';

UPDATE challenge_disbursements 
SET 
    challenge_id = 'ft', 
    specifier = to_hex(specifier::integer) 
WHERE challenge_id = 'send-first-tip';

UPDATE challenge_disbursements 
SET 
    challenge_id = 'fp', 
    specifier = to_hex(specifier::integer) 
WHERE challenge_id = 'first-playlist';

UPDATE challenge_disbursements 
SET 
    challenge_id = 'r', 
    specifier = 
      to_hex(split_part(specifier, '=>', 1)::integer) || 
      ':' || 
      to_hex(split_part(specifier, '=>', 2)::integer)
WHERE challenge_id = 'referrals';

UPDATE challenge_disbursements 
SET 
    challenge_id = 'rv', 
    specifier = 
      to_hex(split_part(specifier, '=>', 1)::integer) || 
      ':' || 
      to_hex(split_part(specifier, '=>', 2)::integer)
WHERE challenge_id = 'ref-v';

UPDATE challenge_disbursements 
SET
    specifier = 
      to_hex(split_part(specifier, '=>', 1)::integer) || 
      ':' || 
      to_hex(split_part(specifier, '=>', 2)::integer)
WHERE challenge_id = 'b';

UPDATE challenge_disbursements 
SET 
    specifier = 
      to_hex(split_part(specifier, '=>', 1)::integer) || 
      ':' || 
      to_hex(split_part(specifier, '=>', 2)::integer)
WHERE challenge_id = 's';

-- readd pkey
ALTER TABLE ONLY challenge_disbursements
    ADD CONSTRAINT challenge_disbursements_pkey PRIMARY KEY (challenge_id, specifier);

-- reenable trigger
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.triggers 
        WHERE event_object_table = 'challenge_disbursements' 
        AND trigger_name = 'on_challenge_disbursement'
    ) THEN
        EXECUTE 'ALTER TABLE challenge_disbursements ENABLE TRIGGER on_challenge_disbursement';
    END IF;
END $$;

-- readd foreign key
ALTER TABLE ONLY user_challenges
    ADD CONSTRAINT user_challenges_challenge_id_fkey FOREIGN KEY (challenge_id) REFERENCES challenges(id);

COMMIT;