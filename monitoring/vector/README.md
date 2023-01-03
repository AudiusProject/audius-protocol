# Audius vector.dev side-car container

To build and push a new image:

```bash
export audius_axiom_token=<token>

docker build \
  -t audius/vector:$(head -n1 Dockerfile | cut -f 2 -d ':') \
  --build-arg git_sha=$(git rev-parse HEAD) \
  --build-arg audius_axiom_token=${audius_axiom_token} \
  .

docker push audius/vector:${VECTOR_VERSION}
```
