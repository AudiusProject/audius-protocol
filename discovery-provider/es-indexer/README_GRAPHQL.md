Audius GraphQL API

### Running tests:

```
make test
```

should run test inside docker compose to make ENV stuff automatic

### Run dev server:

```
make dev
```

This is pre-configured to use steve's sandbox environment with prod data.

### manual build + push

```
DOCKER_DEFAULT_PLATFORM=linux/amd64 docker build . -t audius/graphql-api:latest
docker push audius/graphql-api:latest
```

## query examples:

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
