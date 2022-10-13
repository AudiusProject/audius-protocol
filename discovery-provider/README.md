# Discovery Node


A Discovery Node is the metadata and indexing layer for the Audius Protocol.


## Development

See the dev-tools [README](https://github.com/AudiusProject/audius-protocol/tree/master/dev-tools).

```bash
audius-compose up

curl http://audius-protocol-discovery-provider-1:5000/health_check
```


## Testing

Unit & integration tests are run through a side-car docker container alongside the main audius stack.

First, ensure your developer stack is running

```bash
audius-compose up

# If running elasticsearch tests, ensure the stack is run with an elasticsearch container
audius-compose up --elasticsearch-replicas 1
```

Run tests

```bash
# Run all tests
docker exec -it audius-protocol-discovery-provider-test-1 pytest

# Run unit tests
docker exec -it audius-protocol-discovery-provider-test-1 pytest src

# Run integration tests
docker exec -it audius-protocol-discovery-provider-test-1 pytest integration_tests

# A single test
docker exec -it audius-protocol-discovery-provider-test-1 pytest src/api/v1/api_unit_test.py
```
