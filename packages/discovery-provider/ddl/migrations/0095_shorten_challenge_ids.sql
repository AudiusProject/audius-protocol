BEGIN;

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

UPDATE user_challenges SET challenge_id = 'p' WHERE challenge_id = 'profile-completion';
UPDATE user_challenges SET challenge_id = 'l' WHERE challenge_id = 'listen-streak';
UPDATE user_challenges SET challenge_id = 'u' WHERE challenge_id = 'track-upload';
UPDATE user_challenges SET challenge_id = 'r' WHERE challenge_id = 'referrals';
UPDATE user_challenges SET challenge_id = 'rv' WHERE challenge_id = 'ref-v';
UPDATE user_challenges SET challenge_id = 'rd' WHERE challenge_id = 'referred';
UPDATE user_challenges SET challenge_id = 'v' WHERE challenge_id = 'connect-verified';
UPDATE user_challenges SET challenge_id = 'm' WHERE challenge_id = 'mobile-install';
UPDATE user_challenges SET challenge_id = 'ft' WHERE challenge_id = 'send-first-tip';
UPDATE user_challenges SET challenge_id = 'fp' WHERE challenge_id = 'first-playlist';

UPDATE user_challenges
    SET specifier = id_encode(CAST(specifier AS INTEGER)) WHERE specifier ~ '^\d+$';
UPDATE user_challenges 
    SET specifier = 
        id_encode(CAST(split_part(specifier, '=>', 1) AS INTEGER)) || 
        ':' || 
        id_encode(CAST(split_part(specifier, '=>', 2) AS INTEGER))
    WHERE specifier ~ '^\d+=>\d+$';

UPDATE challenge_disbursements SET challenge_id = 'l' WHERE challenge_id = 'listen-streak';
UPDATE challenge_disbursements SET challenge_id = 'p' WHERE challenge_id = 'profile-completion';
UPDATE challenge_disbursements SET challenge_id = 'u' WHERE challenge_id = 'track-upload';
UPDATE challenge_disbursements SET challenge_id = 'r' WHERE challenge_id = 'referrals';
UPDATE challenge_disbursements SET challenge_id = 'rv' WHERE challenge_id = 'ref-v';
UPDATE challenge_disbursements SET challenge_id = 'rd' WHERE challenge_id = 'referred';
UPDATE challenge_disbursements SET challenge_id = 'v' WHERE challenge_id = 'connect-verified';
UPDATE challenge_disbursements SET challenge_id = 'm' WHERE challenge_id = 'mobile-install';
UPDATE challenge_disbursements SET challenge_id = 'ft' WHERE challenge_id = 'send-first-tip';
UPDATE challenge_disbursements SET challenge_id = 'fp' WHERE challenge_id = 'first-playlist';

UPDATE challenge_disbursements
    SET specifier = id_encode(CAST(specifier AS INTEGER)) WHERE specifier ~ '^\d+$';
UPDATE challenge_disbursements 
    SET specifier = 
        id_encode(CAST(split_part(specifier, '=>', 1) AS INTEGER)) || 
        ':' || 
        id_encode(CAST(split_part(specifier, '=>', 2) AS INTEGER))
    WHERE specifier ~ '^\d+=>\d+$';

COMMIT;

