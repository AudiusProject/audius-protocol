# Audius Solana Programs

`audius/solana-programs` takes about 30 mins to build. and rarely changes. As such we typically run dev via `image: audius/solana-programs:latest` in lieu of a `build` step.

## Build

> There are probably better ways to do this..

If you are changing solana-programs and require a rebuild:

**Step 1**

Builds performed locally will only run on arm processors (m1 mac).

```
cd dev-tools/compose
DOCKER_BUILDKIT=1 docker compose --profile=solana-build build solana-test-validator-build
docker push audius/solana-programs:latest-arm64
```

**Step 2**

Image must be built on a linux machine and pushed.
Modify the image directive in `docker-compose.blockchain.yml:solana-test-validator-build` to look like

```
# image: audius/solana-programs:latest-arm64 # build on mac
image: audius/solana-programs:latest-amd64 # build on linux
```

Then run build and push.

```
DOCKER_BUILDKIT=1 docker compose --profile=solana-build build solana-test-validator-build
docker push audius/solana-programs:latest-amd64
```

**Step 3**

Publish a docker manifest that will allow both architectures to be tagged with `latest`

```
docker manifest create audius/solana-programs:latest --amend audius/solana-programs:latest-arm64 --amend audius/solana-programs:latest-amd64
docker manifest push audius/solana-programs:latest
```

Now if you visit the solana-programs [dockerhub](https://hub.docker.com/repository/docker/audius/solana-programs/tags?page=1&ordering=last_updated) you should see a `latest` tag that references two architectures.

Docker will pull the correct image for the host at runtime.

> Again, theres probably a better way to do this.
