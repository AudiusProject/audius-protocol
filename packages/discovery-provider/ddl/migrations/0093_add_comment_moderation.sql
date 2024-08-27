begin;

CREATE TABLE muted_users (
    muted_user_id integer NOT NULL,
    user_id integer NOT NULL,
    created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_delete boolean DEFAULT false,
    txhash text NOT NULL,
    blockhash text NOT NULL,
    blocknumber integer REFERENCES blocks(number) ON DELETE CASCADE,
    PRIMARY KEY (muted_user_id, user_id)

);


CREATE TABLE reported_users (
    reported_user_id integer NOT NULL,
    user_id integer NOT NULL,
    created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_delete boolean DEFAULT false,
    txhash text NOT NULL,
    blockhash text NOT NULL,
    blocknumber integer REFERENCES blocks(number) ON DELETE CASCADE,
    PRIMARY KEY (reported_user_id, user_id)
);

commit;