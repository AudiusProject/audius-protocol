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
