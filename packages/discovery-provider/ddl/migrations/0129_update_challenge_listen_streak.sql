begin;

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
  amount = 7,
  is_complete = true
FROM next_row nr
WHERE 
  uc.user_id = nr.user_id AND
  uc.challenge_id = nr.challenge_id AND
  uc.specifier = nr.specifier AND
  nr.amount = 7 AND 
  nr.next_amount = 1 AND 
  nr.next_is_complete = true;

commit; 
