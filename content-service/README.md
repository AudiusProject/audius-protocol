# Audius Content Service

The content service monitors Audius activity and intelligently selects what content it
should cache to maximize revenue for the operator of the service.

Under active development - expect instability and significant changes.

Because the content service is only a cache, redundancy and backups are not strictly
necessary. A service operator can decide what level of potential downtime, in what scenario,
may be acceptable given the cost savings associated with less redundancy.

## Getting started with Content Service development

The content service has dependencies on 1) a database instance and 2) an IPFS node. To
make it convenient to get started, a docker-compose file has been included that can be
used with the default configuration.

If you are running the content service for development locally, there is also a dependency
on IPFS, which must already be running on the local system. A docker-compose.ipfs.yml file
is included to start this container locally, and it must be run before other processes can
be run.
```
docker-compose -f docker-compose/docker-compose.ipfs.yml up
```


The following commands will start the content service locally:

```
# install content service dependencies
npm install
# start content service dependencies
docker-compose -f docker-compose/docker-compose.deps.yml up
# in a separate terminal tab from dependencies, start the service
npm start
```

When making changes, [nodemon](https://nodemon.io/) handles auto-restarting to load code
changes without having to manually restart the process.

## Tests

Tests can be run with the included script `./scripts/run-tests.sh` or via npm by running
`npm test`. The CircleCI configuration uses the same testing entry point.

## DB and ORM

The content service currently depends on postgres, but uses the Sequelize ORM which would
allow other databases to potentially be used in future. [Migrations](http://docs.sequelizejs.com/manual/tutorial/migrations.html) are run every time the
content service starts.

For full documentation on how to interact with the Sequelize models, including migrations,
see the [extensive documentation](http://docs.sequelizejs.com/) provided on the Sequelize
website.

## Configuration

All available configuration values are listed in default-config.json. The precedence order for
loading config values is as follows (in decreasing order of priority):
1) environment variables (ex. `ipfsPort=5001 node src/index.js`), 2) a local-config.json
file located in the root of the repository, and 3) values set in default-config.json. For
example, if ipfsPort were set via an environment variable and in `local-config.json`,
the value provided in the environment variable would be used.

## Docker

The service is also dockerized! Variables listed in default-config.json can be overridden via
environment variables to configure the docker container.

### Docker compose

It is much easier to use the content service with docker-compose rather than docker directly,
as the included docker-compose file handles setting up a database and IPFS daemon as well.

To start the dockerized content service, run:

```
docker-compose -f docker-compose/docker-compose.full.yml up
```

In development, it may be useful to use the `--build` flag to rebuild changes.

For local development, the file `docker-compose/docker-compose.deps.yml` is included to
launch external dependencies without launching the service itself, avoiding the need to
rebuild the container to test changes.
