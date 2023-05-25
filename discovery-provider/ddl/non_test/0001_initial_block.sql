INSERT INTO "blocks"
("blockhash", "parenthash", "is_current")
VALUES
(
    '0x0',
    NULL,
    TRUE
)
on conflict do nothing;