begin;

ALTER TABLE
    user_challenges
ADD
    COLUMN IF NOT EXISTS amount INT DEFAULT NULL;

commit;


begin;

UPDATE
    user_challenges 
    SET amount = 1
    WHERE amount IS NULL
    AND challenge_id = 'profile-completion';

UPDATE
    user_challenges 
    SET amount = 1
    WHERE amount IS NULL
    AND challenge_id = 'listen-streak';

UPDATE
    user_challenges 
    SET amount = 1
    WHERE amount IS NULL
    AND challenge_id = 'track-upload';

UPDATE
    user_challenges 
    SET amount = 1
    WHERE amount IS NULL
    AND challenge_id = 'referrals';

UPDATE
    user_challenges 
    SET amount = 1
    WHERE amount IS NULL
    AND challenge_id = 'ref-v';

UPDATE
    user_challenges 
    SET amount = 1
    WHERE amount IS NULL
    AND challenge_id = 'referred';

UPDATE
    user_challenges 
    SET amount = 5
    WHERE amount IS NULL
    AND challenge_id = 'connect-verified';

UPDATE
    user_challenges 
    SET amount = 1
    WHERE amount IS NULL
    AND challenge_id = 'mobile-install';

UPDATE
    user_challenges 
    SET amount = 100
    WHERE amount IS NULL
    AND challenge_id = 'tt';

UPDATE
    user_challenges 
    SET amount = 100
    WHERE amount IS NULL
    AND challenge_id = 'tut';

UPDATE
    user_challenges 
    SET amount = 100
    WHERE amount IS NULL
    AND challenge_id = 'tp';

UPDATE
    user_challenges 
    SET amount = 2
    WHERE amount IS NULL
    AND challenge_id = 'send-first-tip';

UPDATE
    user_challenges 
    SET amount = 2
    WHERE amount IS NULL
    AND challenge_id = 'first-playlist';

commit;
