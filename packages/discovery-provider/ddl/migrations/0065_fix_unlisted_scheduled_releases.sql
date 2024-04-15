BEGIN;
DO $$ BEGIN
-- Prod gate
IF EXISTS (SELECT * FROM "blocks" WHERE "blockhash" = '0x8d5e6984014505e1e11bcbb1ca1a13bcc6ae85ac74014710a73271d82ca49f01') THEN
    update tracks set is_scheduled_release = true where track_id = 298895953;
    update tracks set is_scheduled_release = true where track_id = 775487688;
    update tracks set is_scheduled_release = true where track_id = 2133170018;
    update tracks set is_scheduled_release = true where track_id = 920207685;
    update tracks set is_scheduled_release = true where track_id = 521012473;
    update tracks set is_scheduled_release = true where track_id = 1524039089;
    update tracks set is_scheduled_release = true where track_id = 1767070200;
    update tracks set is_scheduled_release = true where track_id = 1794280147;
    update tracks set is_scheduled_release = true where track_id = 899357822;
    update tracks set is_scheduled_release = true where track_id = 1220022290;
    update tracks set is_scheduled_release = true where track_id = 337745433;
    update tracks set is_scheduled_release = true where track_id = 1348949705;
    update tracks set is_scheduled_release = true where track_id = 1508948611;
    update tracks set is_scheduled_release = true where track_id = 2052790069;
    update tracks set is_scheduled_release = true where track_id = 795124183;
    update tracks set is_scheduled_release = true where track_id = 1672394875;
    update tracks set is_scheduled_release = true where track_id = 1640891388;
    update tracks set is_scheduled_release = true where track_id = 608432360;
    update tracks set is_scheduled_release = true where track_id = 1380052679;
    update tracks set is_scheduled_release = true where track_id = 1234158054;
    update tracks set is_scheduled_release = true where track_id = 976305580;
    update tracks set is_scheduled_release = true where track_id = 1479387693;
    update tracks set is_scheduled_release = true where track_id = 305343531;
    update tracks set is_scheduled_release = true where track_id = 449434053;
    update tracks set is_scheduled_release = true where track_id = 911295647;
    update tracks set is_scheduled_release = true where track_id = 206263891;
    update tracks set is_scheduled_release = true where track_id = 1706746805;
END IF;
END $$;
COMMIT;