# Build Custom Audius Logstash Sidecar Container

```bash
# .env contains: LOGGLY_TOKEN=xxx
. .env

LOGSPOUT_VERSION=$(head -n1 Dockerfile | cut -f 2 -d ':')
docker build \
    -t audius/logspout:latest \
    -t audius/logspout:${LOGSPOUT_VERSION} \
    --build-arg LOGGLY_TOKEN=${LOGGLY_TOKEN} \
    .
docker push audius/logspout:latest
docker push audius/logspout:${LOGSPOUT_VERSION}
```
