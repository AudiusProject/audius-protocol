# Audius Creator Node

The creator node currently maintains availability of creators' content on IPFS, and
will be extended in future to handle proxy reencryption requests from end-user clients.

It can currently be backed by either S3 or a local directory. Other storage backends
could be added in future.

Code originally adapted from [this example](https://github.com/ipfs/js-datastore-s3/tree/master/examples/full-s3-repo).

## Getting started with Creator Node development

The creator node has dependencies on 1) a database instance and 2) an IPFS node. To make
it convenient to get started, a docker-compose file has been included that can be used
with the default configuration.

If you are running the creator node for development locally, there is also a dependency on IPFS, which must already be running on the local system. A docker-compose.ipfs.yml file is included to start this container locally, and it must be run before other processes can be run.
```
docker-compose -f docker-compose/docker-compose.ipfs.yml up
```


The following commands will start the creator node locally:

```
# install creator node dependencies
npm install
# when running locally, files uploaded to creator node are persisted here
mkdir file_storage
# start creator node dependencies
docker-compose -f docker-compose/docker-compose.deps.yml up
# in a separate terminal tab from dependencies, start the node
npm start
```

When making changes, [nodemon](https://nodemon.io/) handles auto-restarting to load code
changes without having to manually restart the process.

## Tests

Tests can be run with the included script `./scripts/run-tests.sh` or via npm by running
`npm test`. The CircleCI configuration uses the same testing entry point.

## DB and ORM

The creator node currently depends on postgres, but uses the Sequelize ORM which would
allow other databases to potentially be used in future. [Migrations](http://docs.sequelizejs.com/manual/tutorial/migrations.html) are run every time the
creator node starts.

For full documentation on how to interact with the Sequelize models, including migrations,
see the [extensive documentation](http://docs.sequelizejs.com/) provided on the Sequelize
website.

## Configuration

All available configuration values are listed in default-config.json. The precedence order for
loading config values is as follows (in decreasing order of priority):
1) environment variables (ex. `storagePath=./ipfs_repository node src/index.js`), 2) a local-config.json
file located in the root of the repository, and 3) values set in default-config.json. For
example, if storagePath were set via an environment variable and in `local-config.json`,
the value provided in the environment variable would be used.

If both storagePath and awsBucket are set, awsBucket and AWS credentials will be used over
local storage. This is relevant to the Docker configuration below.

## Docker

The node is also dockerized! It looks for a volume mounted at `/file_storage` to use as
the local storage. Variables listed in default-config.json can also be overridden via
environment variables to configure the docker container for use with S3.

To run it with a persistent local volume (otherwise every restart of the container will
create a new volume):

```
docker volume create file_volume_name
docker run -p EXTERN_PORT:8000 --mount source=file_volume_name,target=/file_storage -d repository/audius-creator-node
```

To run with S3, override the storagePath configuration set in the Dockerfile using
a .env file or CLI environment variables in the following manner:

```
docker run --env awsBucket=BUCKET --env awsAccessKeyId=ID --env awsSecretAccessKey=KEY -p EXTERN_PORT:8000 -d repository/audius-creator-node
```

### Docker compose

It is much easier to use the creator node with docker-compose rather than docker directly,
as the included docker-compose file handles setting up a database and IPFS daemon as well.

To start the dockerized creator node, run:

```
docker-compose -f docker-compose/docker-compose.full.yml up
```

In development, it may be useful to use the `--build` flag to rebuild changes.

For local development, the file `docker-compose/docker-compose.deps.yml` is included to
launch external dependencies without launching the node itself, avoiding the need to
rebuild the container to test changes.

### [AWS Deployment Info](aws_creator_node_deployment.md)


## Interacting with the Creator Node API

Below is a sample of useful commands that use the `httpie` (brew install httpie) client interface.
This is a work in progress, and should be moved to a more permanent documentation platform.

```
# create signature
$ node
> // begin node
const sigUtil = require('eth-sig-util')
const { createStarterCNodeUser, testEthereumConstants } = require('./test/lib/dataSeeds')
const ts = Math.round((new Date()).getTime() / 1000)
const data = 'This is a message:' + ts.toString()
const signature = sigUtil.personalSign(Buffer.from(testEthereumConstants.privKeyHex, 'hex'), { data })
> data
'This is a message:1556128758'
> signature
'0xd48b32ae0d6f32a5aa55ffb41c7c262243e76f775f4b82976631984bb1f5ab0e02d2390fbdd189848f81d2ec1e862489c266aec2fe03897453704ba4e88a07221b'
>  // end node

# constants from ./test/lib/dataSeeds.js
PUB_KEY=0xadD36bad12002f1097Cdb7eE24085C28e960FC32
PRIV_KEY_HEX=acd6db99f7354043bf7a14a4fbb81b348e028717933eda978afd97b3e80cf1da
# from node session
DATA='This is a message:1556128758'
SIGNATURE='0xd48b32ae0d6f32a5aa55ffb41c7c262243e76f775f4b82976631984bb1f5ab0e02d2390fbdd189848f81d2ec1e862489c266aec2fe03897453704ba4e88a07221b'
```

USERS
```
# create user
http localhost:4000/users walletAddress="$PUB_KEY"

# login user
# note we use `jq` (brew install jq)
# to unpack returned json and bind to env var
SESSION_TOKEN=$(http localhost:4000/users/login data="$DATA" signature="$SIGNATURE" | jq -r .sessionToken)

# logout user
http POST localhost:4000/users/logout X-Session-ID:$SESSION_TOKEN
```

TRACKS
```
# upload track
http -f POST localhost:4000/track_content X-Session-ID:$SESSION_TOKEN file@test/testTrack.mp3 fileDir='file_storage'
...
{
    "track_segments": [
        {
            "duration": "11.882667",
            "multihash": "QmShxEN43D7YCJkQ22aS4CV8wXQ6Mi613tTzXiAJmg2bjt"
        },
        {
            "duration": "11.946667",
            "multihash": "QmcwfU2tK8PtYEeuZ6Kj563BCrAWWGNBpYoBAvtcyFM43g"
        },
        ...,
        {
            "duration": "11.946667",
            "multihash": "Qma8chHPgVgMYKHnE2K7ttE8rnjeH9ZvBxfJcXBwRWtL4e"
        },
        {
            "duration": "7.424000",
            "multihash": "QmeXQmzzVYALQFo1fvzUM3LfMfMEyyPkj9hjHYH13U6SRm"
        }
    ]
}
```
