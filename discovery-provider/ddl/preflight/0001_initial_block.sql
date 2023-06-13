INSERT INTO "blocks"
("blockhash", "parenthash", "number", "is_current")
VALUES
(
    '0x0',
    NULL,
    0,
    TRUE
)
on conflict do nothing;