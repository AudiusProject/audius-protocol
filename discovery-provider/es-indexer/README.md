Run it (outside of docker)

```
export audius_elasticsearch_url=http://localhost:9200
export DEBUG=es-indexer:*
npm i
time ./node_modules/.bin/ts-node etl/etl.ts --drop
```

Mapping change:

- Increment version suffix in `indexNames.ts`
- In python code: update index name to match in `elasticdsl.py`
- You may want to also adjust `omit_keys` in `elasticdsl.py` if adding new fields for indexing which should be removed.
