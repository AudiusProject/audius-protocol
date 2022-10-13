Audius GraphQL API

### Running tests:

```
docker-compose up -d
./tests/tests.sh
```

should run test inside docker compose to make ENV stuff automatic

### Run dev server:

```
export audius_db_url=x
export audius_elasticsearch_url=y
npm run dev
```

### manual build + push

```
DOCKER_DEFAULT_PLATFORM=linux/amd64 docker build . -t audius/graphql-api:latest
docker push audius/graphql-api:latest
```


examples:

```
query Feed {
  feed(limit: 60) {
    ... on Playlist {
      name
      favorite_count
      tracks {
        title
        favorite_count
      }
    }
    ... on Track {
      title
      favorite_count
    }
  }
}
```
