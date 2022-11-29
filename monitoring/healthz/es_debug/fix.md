## nuke old index + restart

```
docker exec -it server bash

bash-5.1# cd es-indexer/
bash-5.1# npm run nuke
bash-5.1# exit
```

## Restart

```
audius-cli restart discovery-provider

docker logs -f server | grep es-indexer
```
