# pg_migrate.sh

tl;dr

- Your migration sql file MUST be idempotent. See [examples](https://github.com/graphile/migrate/blob/main/docs/idempotent-examples.md) of ways to do this.
- Transactions are up to you... you SHOULD wrap your statements in a transaction: `begin;  commit;`
- If you cannot make your `.sql` file idempotent or safe, you can add `failable` to the file name and errors will be printed and ignored.

## TEST

After making a change, verify it with:

```
bash local-test.sh
```

To get a `psql` prompt after tests (to explore schema, or experiment) add `psql` at end:

```
bash local-test.sh psql
```

#### Re-run a sql file in the prompt

If you ran `psql` to get a prompt you can re-interpret files after you change them:

```
\i /sql/functions/chat_allowed.sql
\i /sql/tests/chat_allowed_test.sql
```

## Example usage

```
createdb hello_pg_migrate
DB_URL=postgres://steve@localhost/hello_pg_migrate bash pg_migrate.sh

# to test idempotency:
DB_URL=postgres://steve@localhost/hello_pg_migrate bash pg_migrate.sh test

dropdb hello_pg_migrate
```

Any change to a file will cause the file to be re-run the next time you invoke `bash pg_migrate.sh`. Whitespace changes are ignored.

## Updating schema dump

`0000_schema_failable.sql` is meant to start with a schema snapshot.

To update it:

```
pg_dump --schema-only --no-owner --no-privileges 'postgresql://user:pass@host:5432/audius_discovery' > migrations/0000_schema_failable.sql

# or
pg_dump --schema-only --no-owner --no-privileges "$audius_db_url" > migrations/0000_schema_failable.sql
```
