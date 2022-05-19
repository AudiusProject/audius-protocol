# Build Custom Audius Logstash Sidecar Container

```bash
# .env contains: audius_loggly_token=xxx
. .env

LOGSPOUT_VERSION=$(head -n1 Dockerfile | cut -f 2 -d ':')
docker build \
    -t audius/logspout:${LOGSPOUT_VERSION} \
    --build-arg git_sha=$(git rev-parse HEAD) \
    --build-arg audius_loggly_token=${audius_loggly_token} \
    .
docker push audius/logspout:latest
docker push audius/logspout:${LOGSPOUT_VERSION}
```
