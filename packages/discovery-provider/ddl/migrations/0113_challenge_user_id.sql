BEGIN;

CREATE INDEX IF NOT EXISTS user_challenges_user_id ON user_challenges USING btree (user_id);
CREATE INDEX IF NOT EXISTS challenge_disbursements_user_id ON challenge_disbursements USING btree (user_id);

COMMIT;
