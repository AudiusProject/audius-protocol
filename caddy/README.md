# Audius Caddy Container

To build and push a new image for both arm64 and amd64:

```bash
docker buildx build \
  --platform linux/arm64,linux/amd64 \
  --tag audius/caddy:$(head -n1 Dockerfile | cut -f 2 -d ':' | cut -d '-' -f 1) \
  --push \
  .
```
