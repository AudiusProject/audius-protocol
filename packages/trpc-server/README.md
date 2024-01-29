## Tests

* run once: `bash test.sh run`
* start watch mode: `bash test.sh`

A global fixture set is used across all tests
and is populated into both postgres and elasticsearch.

To add more fixtures, edit `test/_fixtures.ts` and restart `bash test.sh`.

Be sure to follow ID range conventions:
* 100-199: users
* 200-299: tracks
* 300-399: playlists

The upside of global fixture set is that a more complex dataset can be done once, and all tests can benefit from having tracks of all different visibility levels to test against.
This is the downside is that adding reposts can break existing tests that assert on repost count.
But I think it is worth it... and this is how rails fixtures work.

## Running against stage / prod

> in the future it would be nice to have stable sandbox + staging nodes
> so you can just pull down a staging .env file and start server
> for now it's manual style

You can run server locally (`npm run dev`) and point it at a staging or sandbox database.

First, `ssh some-sandbox` add this to `audius-docker-compose/discovery-provider/.env`.
These are only accessible via VPN so this is safe to do:

```
EXPOSE_POSTGRES: :5432
EXPOSE_ELASTICSEARCH: :9200
```

Now create `.env` file in this directory
(using the external IP of `some-sandbox`):

```
audius_elasticsearch_url=http://1.2.3.4:9200
audius_db_url=postgres://postgres:postgres@1.2.3.4:5432/audius_discovery
```

Start server:

```
npm run dev
```

Override `TRPC_ENDPOINT`` in the appropriate env (e.g. env.prod.ts)

```
npm run web:prod
```
