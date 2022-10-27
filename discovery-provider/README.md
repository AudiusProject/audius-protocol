# Discovery Node


A Discovery Node is the metadata and indexing layer for the Audius Protocol.


## Development

See the dev-tools [README](https://github.com/AudiusProject/audius-protocol/tree/main/dev-tools).

```bash
audius-compose up

curl http://audius-protocol-discovery-provider-1:5000/health_check
```


## Testing

Run tests

```bash
# Run all tests
audius-compose test discovery-provider

# Run unit tests
audius-compose test discovery-provider src

# Run integration tests
audius-compose test discovery-provider integration_tests

# A single test
audius-compose test discovery-provider src/api/v1/api_unit_test.py
```
