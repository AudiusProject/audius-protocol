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


CREATE TABLE reported_comments (
    reported_comment_id integer NOT NULL,
    user_id integer NOT NULL,
    created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    txhash text NOT NULL,
    blockhash text NOT NULL,
    blocknumber integer REFERENCES blocks(number) ON DELETE CASCADE,
    PRIMARY KEY (reported_comment_id, user_id)
);

commit;