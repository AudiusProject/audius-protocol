# Discprov Postgraphile

Postgraphile is a tool used to generate a graphql API based on database schemas. This directory has the setup for being able to do this against a discprov database.

## Configuration

Write a `.env` file that contains the connection string for the postgres db. Here's an example with the containerized databases as well as running a local instance of [houseparty](https://github.com/AudiusProject/houseparty).
```
# containerized db
# DATABASE_URL=postgresql://postgres:postgres@db:5432/audius_discovery
# houseparty local db
DATABASE_URL=postgresql://postgres:pass@host.docker.internal:5432/default_db
```

## Commands

Starting the GQL and Graphiql server (this will also build on the first run)
```
alec in audius-protocol/discovery-provider/postgraphile on  as/postgraphile [$?⇡] on ☁️  alec@audius.co(us-central1)
❯ make up
docker compose -f docker-compose.pgql.yml up -d
[+] Running 1/0
 ⠿ Container postgraphile  Running
```

Stopping the GQL and Graphiql server
```
alec in audius-protocol/discovery-provider/postgraphile on  as/postgraphile [$?⇡] on ☁️  alec@audius.co(us-central1)
❯ make down
docker compose -f docker-compose.pgql.yml down
[+] Running 2/2
 ⠿ Container postgraphile        Removed                                                                                                                  10.2s
 ⠿ Network postgraphile_default  Removed
```

## Usage

You can then access the graphql api and graphiql at these locations! These logs are also present in the container.

```
postgraphile  | PostGraphile v4.13.0 server listening on port 5433 🚀
postgraphile  |   ‣ GraphQL API:         http://0.0.0.0:5433/graphql (subscriptions enabled)
postgraphile  |   ‣ GraphiQL GUI/IDE:    http://0.0.0.0:5433/graphiql
```
