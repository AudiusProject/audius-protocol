BEGIN;
DO $$ BEGIN
-- Non-prod gate so migration doesn't run on prod
IF NOT EXISTS (SELECT * FROM "blocks" WHERE "blockhash" = '0x8d5e6984014505e1e11bcbb1ca1a13bcc6ae85ac74014710a73271d82ca49f01') THEN
    UPDATE eth_blocks SET last_scanned_block = 5117133;
END IF;
END $$;
COMMIT;