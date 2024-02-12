# Audius healthz service and side-car
## To run locally

```
nvm use

npm i
npm run dev
```

## To build docker image:

Builds for both arm64 and amd64:

```bash
docker buildx build \
  --platform linux/arm64,linux/amd64 \
  --tag audius/healthz:$(git rev-parse HEAD) \
  --push \
  .
```

## To deploy to Cloudflare Pages

Ensure you have cloudflare access.
Deploy with:

```
nvm use
npm i
npm run deploy
```

Note: when it asks `Would you like to help improve Wrangler by sending usage metrics to Cloudflare? (y/n)` either yes or no is fine.
