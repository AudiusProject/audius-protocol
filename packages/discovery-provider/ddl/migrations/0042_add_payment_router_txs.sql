begin;

CREATE TABLE IF NOT EXISTS payment_router_txs (
    signature character varying NOT NULL,
    slot integer NOT NULL,
    created_at timestamp without time zone NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_payment_router_txs_slot ON payment_router_txs USING btree (slot);

commit;