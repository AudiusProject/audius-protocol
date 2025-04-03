begin;

alter table user_challenges disable trigger on_user_challenge;

-- First update the challenge_listen_streak table
WITH latest_incomplete_seven_per_user AS (
  SELECT DISTINCT ON (user_id)
    user_id,
    created_at as seven_created_at
  FROM user_challenges
  WHERE 
    challenge_id = 'e' AND
    amount = 7 AND
    current_step_count != amount AND
    created_at <= '2025-03-25' AND 
    created_at > '2025-03-14'
  ORDER BY user_id, created_at DESC
),
valid_streaks AS (
  SELECT 
    ls.user_id,
    7 + COUNT(uc.user_id) as streak_count
  FROM latest_incomplete_seven_per_user ls
  LEFT JOIN user_challenges uc ON 
    uc.user_id = ls.user_id AND
    uc.challenge_id = 'e' AND
    uc.created_at > ls.seven_created_at AND
    uc.amount = 1 AND
    uc.is_complete = true
  WHERE NOT EXISTS (
    -- Exclude if there are ANY incomplete rows after our target seven
    SELECT 1 
    FROM user_challenges uc_incomplete
    WHERE 
      uc_incomplete.user_id = ls.user_id AND
      uc_incomplete.challenge_id = 'e' AND
      uc_incomplete.created_at > ls.seven_created_at AND
      uc_incomplete.created_at != ls.seven_created_at AND
      uc_incomplete.current_step_count != uc_incomplete.amount
  )
  AND EXISTS (
    -- Still require at least one completed amount=1 row after the seven
    SELECT 1 
    FROM user_challenges uc_next
    WHERE 
      uc_next.user_id = ls.user_id AND
      uc_next.challenge_id = 'e' AND
      uc_next.created_at > ls.seven_created_at AND
      uc_next.amount = 1 AND
      uc_next.is_complete = true
  )
  GROUP BY ls.user_id
)
UPDATE challenge_listen_streak cls
SET listen_streak = vs.streak_count
FROM valid_streaks vs
WHERE cls.user_id = vs.user_id;

-- Then update the user_challenges table

WITH next_row AS (
  SELECT 
    uc1.*,
    LEAD(amount) OVER (PARTITION BY user_id, challenge_id ORDER BY created_at ASC) as next_amount,
    LEAD(is_complete) OVER (PARTITION BY user_id, challenge_id ORDER BY created_at ASC) as next_is_complete
  FROM user_challenges uc1
  WHERE challenge_id = 'e'
)
UPDATE user_challenges uc
SET 
  current_step_count = 7,
  is_complete = true
FROM next_row nr
WHERE 
  uc.user_id = nr.user_id AND
  uc.challenge_id = nr.challenge_id AND
  uc.specifier = nr.specifier AND
  nr.amount = 7 AND 
  nr.current_step_count != nr.amount AND
  nr.next_amount = 1 AND 
  nr.next_is_complete = true AND
  nr.created_at <= '2025-03-25' AND 
  nr.created_at > '2025-03-14';

alter table user_challenges enable trigger on_user_challenge;

commit; 
