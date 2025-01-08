CREATE INDEX user_challenges_user_id ON user_challenges USING btree (user_id);
CREATE INDEX challenge_disbursements_user_id ON challenge_disbursements USING btree (user_id);
