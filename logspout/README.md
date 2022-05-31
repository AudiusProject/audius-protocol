# Build Custom Audius Logspout Sidecar Container

```bash
# .env contains: audius_loggly_token=xxx
. .env

LOGSPOUT_VERSION=$(head -n1 Dockerfile | cut -f 2 -d ':')
[ ${audius_loggly_token} ] \
    && audius_loggly_token_64=$(echo ${audius_loggly_token} | base64) \
    && docker build \
        -t audius/logspout:${LOGSPOUT_VERSION} \
        --build-arg git_sha=$(git rev-parse HEAD) \
        --build-arg audius_loggly_token=${audius_loggly_token_64} \
        . \
    && docker push audius/logspout:${LOGSPOUT_VERSION}
```
