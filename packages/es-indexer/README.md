# es-indexer

Indexes data from postgres to elasticsearch.

To run in the discovery container, set env variables:

```
audius_elasticsearch_url=http://elasticsearch:9200
```

## Mapping Changes

If adding a new field, or changing an existing field mapping, the safest thing is to roll a new index:

- Increment version suffix in `indexNames.ts`
- You may want to also adjust `omit_keys` in `elasticdsl.py` if adding new fields for indexing which should be removed.

If you are adding a new denormalization (attaching data from a related model), the data dependency tracking should be updated:

- For "catchup" mode this is the `checkpointSql` function. See UserIndexer or TrackIndexer for an example
- For listen / notify mode, this is the handler code in `listen.ts`

When working on mapping changes, I might put code like this at top of `main.ts main()` function:

```ts
await indexer.playlists.createIndex({ drop: true })
await indexer.playlists.catchup()
process.exit(0)
```

and then:

```
source .env
npm run dev --drop
```

> it's important to run with `--drop` to catch any errors in index settings. Without --drop 400 errors will be silently ignored.

## How it works

Program attempts to avoid any gaps by doing a "catchup" on boot... when complete it swithces to processing "batches" which are events collected from postgres LISTEN / NOTIFY.

Any error or exception will cause the program to crash and be restarted by pm2. This is inspired by the erlang "let it crash" mantra, since the startup behavior is designed to get everything into a good state.

When program boots it does the following:

- creates elasticsearch indexes (as described in `indexNames.ts`) if they don't exist
- creates postgres function + triggers if they don't exist (see `setup.ts`)
- indexer starts listening for update events + collecting in a buffer (see `listener.ts`)
- meanwhile it does a "catchup" to backfill the index based on previous high blocknumber (`main.ts`)
- when catchup is complete it cuts over read alias to complete index
- after this it processes buffered events (during catchup) and processes subsequent events on a 500ms interval.

## Debugging

Check "elasticsearch" health info in `/health_check?verbose=true` endpoint.

(instructions for sandbox3... subject to change):

Use Kibana:
Uncomment the kibana container and restart discovery-provider.

List indices:

```
curl http://localhost:9200/_cat/indices?v
```

Use the sql cli:

```
docker-compose exec elasticsearch elasticsearch-sql-cli

select max(blocknumber) from users;
select max(created_at) from users;
```

Tail the es-indexer logs:

```
docker-compose logs -f discovery | grep es-indexer
```
