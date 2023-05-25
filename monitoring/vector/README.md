# Audius vector.dev side-car container

To build and push a new image for both arm64 and amd64:

```bash
export audius_axiom_token=<token>
export vector_version=$(head -n1 Dockerfile | cut -f 2 -d ':')

docker buildx build \
  --platform linux/arm64,linux/amd64 \
  --tag audius/vector:$(head -n1 Dockerfile | cut -f 2 -d ':') \
  --build-arg git_sha=$(git rev-parse HEAD) \
  --build-arg audius_axiom_token=${audius_axiom_token} \
  --push \
  .
```

NOTE: if you get the following error:

```
ERROR: failed to solve: DeadlineExceeded: DeadlineExceeded: DeadlineExceeded: timberio/vector:0.28.1-alpine: failed to do request: Head "https://registry-1.docker.io/v2/timberio/vector/manifests/0.28.1-alpine": dial tcp 44.205.64.79:443: i/o timeout
```

Make sure you are logged in (using `docker login`) and on the latest version of docker.
