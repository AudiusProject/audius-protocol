begin;

alter table user_challenges disable trigger on_user_challenge;
alter table challenge_disbursements disable trigger on_challenge_disbursement;

-- Update specifiers in user_challenges table, skipping any that would conflict with existing records
UPDATE user_challenges uc
SET specifier = REPLACE(uc.specifier, '_', ':')
WHERE challenge_id IN ('e', 'p1', 'p2', 'p3')
AND specifier LIKE '%_%'
AND NOT EXISTS (
    SELECT 1 FROM user_challenges existing
    WHERE existing.challenge_id = uc.challenge_id
    AND existing.specifier = REPLACE(uc.specifier, '_', ':')
    AND existing.specifier != uc.specifier
);

-- Update specifiers in challenge_disbursements table, skipping any that would conflict with existing records
UPDATE challenge_disbursements cd
SET specifier = REPLACE(cd.specifier, '_', ':')
WHERE challenge_id IN ('e', 'p1', 'p2', 'p3')
AND specifier LIKE '%_%'
AND NOT EXISTS (
    SELECT 1 FROM challenge_disbursements existing
    WHERE existing.challenge_id = cd.challenge_id
    AND existing.specifier = REPLACE(cd.specifier, '_', ':')
    AND existing.specifier != cd.specifier
);

alter table user_challenges enable trigger on_user_challenge;
alter table challenge_disbursements enable trigger on_challenge_disbursement;
commit; 
