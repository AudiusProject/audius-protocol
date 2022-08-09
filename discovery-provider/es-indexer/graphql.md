Audius GraphQL API

```
docker-compose up -d

# run es-indexer to populate
cd discovery-provider/es-indexer
source .env
npm run dev

# run dev server
npm run dev
```


manual build + push

```
DOCKER_DEFAULT_PLATFORM=linux/amd64 docker build . -t audius/graphql-api:latest
docker push audius/graphql-api:latest
```
