begin;

alter table user_challenges disable trigger on_user_challenge;
alter table challenge_disbursements disable trigger on_challenge_disbursement;

-- Update specifiers in user_challenges table
UPDATE user_challenges
SET specifier = REPLACE(specifier, '_', ':')
WHERE challenge_id IN ('e', 'p1', 'p2', 'p3')
AND specifier LIKE '%_%';

-- Update specifiers in challenge_disbursements table
UPDATE challenge_disbursements
SET specifier = REPLACE(specifier, '_', ':')
WHERE challenge_id IN ('e', 'p1', 'p2', 'p3')
AND specifier LIKE '%_%';

alter table user_challenges enable trigger on_user_challenge;
alter table challenge_disbursements enable trigger on_challenge_disbursement;
commit; 
