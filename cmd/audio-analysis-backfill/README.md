# audio analysis backfill program

## building

```
make release-aa-backfill
```
this will create a docker image and push it to audius dockerhub, make sure to be logged in


```
docker run --pull always --network creator-node_creator-node-network -v $(pwd)/output:/app/output -e isProd="false" audius/audio-analysis-backfill:latest
```
