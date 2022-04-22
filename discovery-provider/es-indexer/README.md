Run it (outside of docker)

```
export audius_elasticsearch_url=http://localhost:9200
export audius_db_url=...
npm i
time ./node_modules/.bin/ts-node etl/etl.ts --drop
```

Mapping change:

- Increment version suffix in `indexNames.ts`
- In python code: update index name to match in `elasticdsl.py`
- You may want to also adjust `omit_keys` in `elasticdsl.py` if adding new fields for indexing which should be removed.



## WIP: low latency indexing

`wip` folder has new version of indexer that does low latency indexing.

```
ts-node wip/main
```

main does the following on boot:

* creates elasticsearch indexes if they don't exist
* creates postgres function + triggers if they don't exist
* indexer starts listening for update events + collecting in a buffer
* meanwhile it does a "catchup" to backfill the index based on previous high blocknumber
* when catchup is complete it cuts over read alias to complete index
* after this it processes buffered events (during catchup) and processes subsequent events on a 500ms interval.

