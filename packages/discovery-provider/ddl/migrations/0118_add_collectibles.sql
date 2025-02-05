begin;

create table if not exists collectibles_data (
    user_id integer not null,
    data jsonb not null,
    constraint pk_user_id primary key (user_id)
);


INSERT INTO collectibles_data (user_id, data)
SELECT u.user_id, cid.data->'collectibles' AS data
FROM users u
LEFT JOIN cid_data cid ON u.metadata_multihash = cid.cid
WHERE u.has_collectibles = TRUE
ON CONFLICT (user_id) DO NOTHING;

commit;