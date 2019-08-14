# What is an Audius Discovery Provider?

An Audius Discovery Provider is a service that indexes the contents of the Audius contracts on the Ethereum blockchain, for Audius users to query. The indexed content includes user, track, and album/playlist information along with social features. The data is stored for quick access, updated on a regular interval, and made available for clients via a RESTful API.


# Table of Contents
- [Up and Running](#up-and-running)
  - [Service Dependencies](#service-dependencies)
  - [Environment Variables](#environment-variables)
- [Running for development](#running-for-development)
  - [Docker Compose](#docker-compose)
  - [Flask](#flask)
  - [Celery/Redis](#celeryredis)
  - [Postgres](#postgres)
- [Tests](#tests)
- [Useful Links](#useful-links)

# Up and Running 

## Service Dependencies
The Discovery Provider depends on external services to run: 
* [IPFS](https://ipfs.io/): A peer-to-peer hypermedia protocol
* [Postgres](https://www.postgresql.org/): A relational database management system.
* [Redis](https://redis.io/): A distributed, in-memory key-value database.
* [Celery](http://www.celeryproject.org/): A distributed task queue
* [Ethereum](Ethereum): A blockchain-based distributed computing platform and operating system featuring smart contract functionality. 

You will need to have Docker and Docker Compose in order to run the discovery provider. For development purposes, see the [running for development](#running-for-development) section below. For production, a single built container which has all dependencies installed ready to run the webserver, celery beat and celery worker is available on Dockerhub. An example Kubernetes manifest file is also available to show an example of how to run this container. 

## Environment Variables 

Variables listed in `default-config.ini` can also be overridden via environment variables. All variables in `default-config.ini` are constructed with the pattern `audius_<section>_<property>`.

The environment variables take the highest priority then `default-config.ini`

**audius_discprov_start_block** `Default: 0x0`  
The block address the discovery provider starts indexing on

**audius_discprov_loglevel_flask** `Default: INFO`  
This optional environment variable is used to define the log level of the flask app. 
Check the [python loggin docs](http://www.red-dove.com/python_logging.html#levels) for more details. 
If it is not specified, then the default value of `INFO` will be used.

**audius_discprov_loglevel_celery** `Default: INFO`  
This optional environment variable is used to define the log level of celery. 
Check the [python loggin docs](http://www.red-dove.com/python_logging.html#levels) for more details. 
If it is not specified, then the default value of `INFO` will be used.

**audius_discprov_block_processing_window** `Default: 50`  
This optional environment variable is used to define the chuck of blocks to process at a time while indexing. 
If it is not specified, then the default value of `50` will be used.

**audius_discprov_blacklist_block_processing_window** `Default: 600`  
This optional environment variable is used to define the chuck of blacklist blocks to process at a time while indexing. 
If it is not specified, then the default value of `600` will be used.

**audius_flask_debug** `Default: true`  
This optional environment variable is used to define whether debug mode is enabled. 
When using `flask run` to start the dev server, an interactive debugger will be 
shown for unhandled exceptions, and the server will be reloaded when code changes.
Check the [flask config debug docs](https://flask.palletsprojects.com/en/1.1.x/config/#DEBUG) for more details. 
If it is not specified, then the default value of `true` will be used.

**audius_flask_testing** `Default: false`  
This optional environment variable is used to enable testing mode. 
Exceptions are propagated rather than handled by the app's error handles. 
Check the [flask config testing docs](https://flask.palletsprojects.com/en/1.1.x/config/#TESTING) for more details. 
If it is not specified, then the default value of `false` will be used.

**audius_flask_jsonify_prettyprint_regular** `Default: true`  
This optional environment variable when set to true will jsonify responses: 
output with newlines, spaces, and indentation for easier reading by humans. 
It is always enabled in debug mode. 
Check the [flask config docs](https://flask.palletsprojects.com/en/1.1.x/config/#JSONIFY_PRETTYPRINT_REGULAR) for more details. 
If it is not specified, then the default value of `true` will be used.

**audius_flask_session_cookie_secure** `Default: false`  
This optional environment variable when set to true will mark cookies as "secure". 
Note, browsers will only send cookies with requests over HTTPS if the cookie is marked “secure”. 
The application must be served over HTTPS for this to make sense.
Check the [flask config docs](https://flask.palletsprojects.com/en/1.1.x/config/#SESSION_COOKIE_SECURE) for more details. 
If it is not specified, then the default value of `false` will be used.

**audius_web3_host**  `Default: localhost`  
This optional environment variable is used in conjunction with `audius_web3_port` to connect the application 
to web3. If it is not specified, then the default value of `localhost` will be used.

**audius_web3_port**  `Default: 8545`  
This optional environment variable is used in conjunction with `audius_web3_host` to connect the application with a 
web3 client. If it is not specified, then the default port of `8545` will be used.

**audius_redis_url**  `Default: redis://localhost:5379/0`  
This optional environment variable is used to define the redis connection url. 
If it is not specified, then the default value of `redis://localhost:5379/0` will be used.

**audius_db_url** `Default: postgresql+psycopg2://postgres@localhost/audius_discovery` . 
The url the discovery provider uses to connect to the postgres database.  

**audius_db_engine_args_literal**  
`Default: {
    'pool_size': 10,
    'max_overflow': 0,
    'pool_recycle': 3600,
    'echo': False,
    'client_encoding': 'utf8',
    'connect_args': {'options': '-c timezone=utc'}
  }
`  
Arguments passed to the [SQLAlchemy](https://www.sqlalchemy.org/) [create_engine function](https://docs.sqlalchemy.org/en/13/core/engines.html)

**audius_ipfs_host**  `Default: 127.0.0.1`  
This optional environment variable is used in conjunction with `audius_ipfs_posrt` to connect the application 
with an ipfs client. This variable will indicate the host on which the ipfs client is running. 
If it is not specified, then the default value of `127.0.0.1` will be used.

**audius_ipfs_port**  `Default: 6001`  
This optional environment variable is used in conjunction with `audius_ipfs_host` to connect the application with a 
ipfs client. This variable will indicate the port on which the ipfs client is running. 
If it is not specified, then the default port of `6001` will be used.

**audius_ipfs_gateway_hosts** `Default: https://cloudflare-ipfs.com,https://ipfs.io`  

**audius_cors_allow_all**  `Default: false`  

**audius_contracts_registry**  `Default: 0x2999e02829DC711B9254187962ba44d1fFcf5481`  
The audius contracts registry address.

**audius_delegate_owner_wallet** 
The public wallet address of the service provider running this service

**audius_delegate_private_key** 
The private key of the service provider running this service

**WAIT_HOSTS**  `Default: 0.0.0.0:5432,0.0.0.0:6379`  
This optional environment variable is used to define the host:port pairs that the application waits for TCP port connection to before starting. The wait script uses these env vars. If not declared, the script executes without waiting.


# Running for development

The external services (redis, postgres, ganache, celery & ipfs) must be running and accessible for the discovery provider application to function. The following commands start each service dependency and the discovery provider. If a service dependency is already running, its setup can be skipped with the host and port correctly passed to the discovery provider. 

NOTE: [ganache](http://truffleframework.com/ganache) is required to be run either locally or with a third party connection for development. The `contracts` library is used to migrate the contracts on the local ganache. Run `./scripts/setup.sh` to run a local ganache and migrate the contacts before running the following docker-compose script. 

[IPFS](http://ipfs.io) is also required to be run locally or have an external connection that can be used. A docker-compose.ipfs.yml file is included to start this container locally for convenience, and it must be run before other discovery provider processes can be run.
```
$ pwd
.../audius-protocol/discovery-provider/
$ docker-compose -f docker-compose.ipfs.yml up -d
```

*A docker network is recommended to isolate the container ports, but the ports are forwarded to the host network for debugging*

**Create a Docker Network**  
```
docker network create disc-prov
```

**Start an IPFS Node Instance**  
```
docker run -d --network=disc-prov \
    --name=disc-prov-ipfs \ 
    ipfs/go-ipfs:release
```

**Start a Redis Instance**  
```
docker run -d --network=disc-prov \
    --name=disc-prov-redis \
    -p 4379:6379 \
    redis:5.0.4
```

**Start a Postgres Instance**  
```
docker run -d --network=disc-prov \
    --name=disc-prov-postgres \
    -p 4432:5432 \
    -e "POSTGRES_USER=postgres" \
    -e "POSTGRES_DB=discovery_provider" \
    -v postgres_data:/var/lib/postgresql/data/ \
    postgres:11.1
```

**Build & Run the Discovery Provider**  
```
# Build the project locally
docker build -t audius/discovery_provider .

# Run the discovery provider in docker 
docker run -d --net-host \
    -v $(pwd):/usr/src/app \
    -e "dbUrl=postgres://postgres:postgres@discovery-provider-postgres:5432/audius_discovery_provider" \
    -e "audius_web3_host=docker.for.mac.localhost" \
    -e "audius_web3_port=8545" \
    -e "ipfsHost=disc-prov-ipfs" \
    -e "ipfsPort=5001" \
    -e "redisHost=disc-prov-redis" \
    -e "redisPort=6379" \
    -e "WAIT_HOSTS=disc-prov-redis:6379,disc-prov-postgres:5432"
    audius/discovery-provider
```

### Docker Compose

[Docker Compose](https://docs.docker.com/compose/) is used for a bit more automated management of the service dependencies.  
**Make sure you have Docker and Docker-compose installed and operational.**

To run the application along with its service dependencies, run 
```
docker-compose -f docker-compose/docker-compose.dev.yml up (--build)
```

*In development, it may be useful to use the `--build` flag to rebuild changes.*


### Flask 
- Application endpoint for listener clients
- Returns content from local DB, queried with SQLAlchemy models 
- Relevant files: `src/app.py`, `src/queries.py`

### Celery/Redis  
- Task scheduler containing beat scheduler and worker task. Redis is used as the 'broker' for celery
- Beat Scheduler - periodically schedules index operations (`src/tasks/celery.py`)
- Worker Task - performs scheduled index operations (`src/tasks/index.py`). Is defined as a 'custom task context' and detailed further in the [Discovery provider architecture](Discovery-Provider--‐-Architecture#component-details)

### Postgres  
- Storage for content index
- Managed by Alembic/SQLAlchemy (details below)

For a complete architecture overview see the [Discovery provider architecture](Discovery-Provider--‐-Architecture#component-details)

# Tests
* Discovery provider tests are written using the pytest framework, with fixtures provided for convenience in `tests\conftest.py`
* Cases are autodiscovered by pytest in files labeled `tests\test_*` 
* Reference more information under [Useful links](#links) 

### Manual Steps

Alembic is the **only component** that must be run manually by developers, and even then it should **only be run** as necessary. For general purpose development, please use the scripts

#### Alembic

[Alembic](http://alembic.zzzcomputing.com/en/latest/index.html) is a SQL database migration tool used in conjunction with SQLAlchemy through which the local postgres database is updated.

Autogenerate revision script:

- Necessary when there are any changes to DB models (src/models.py)
- Generates revision script under alembic/versions, but does NOT perform database upgrade
- Execute in ROOT directory of audius-discovery-provider

```
$ ~/Development/audius-discovery-provider> alembic revision --autogenerate -m "revision string"
```

- must be in venv with requirements installed using
```
> pip install -r requirements.txt
> pip install -e .
```

Upgrade HEAD (optional):

- Upgrades local database per alembic/version scripts
- Performed by application during init, does not have to be executed by user

```
$ ~/Development/audius-discovery-provider> alembic upgrade head
```


# Links

#### Circus

https://circus.readthedocs.io/en/latest/for-ops/configuration/

https://github.com/circus-tent/circus/blob/master/examples/example6.ini

#### Postgres

http://postgresguide.com/utilities/psql.html

#### SQL Alchemy

https://www.sqlalchemy.org/

https://docs.sqlalchemy.org/en/latest/orm/tutorial.html

http://docs.sqlalchemy.org/en/latest/orm/query.html

https://docs.sqlalchemy.org/en/latest/core/sqlelement.html#sqlalchemy.sql.expression.ColumnElement.in\_

Tons of useful examples outside official docs:
https://www.pythonsheets.com/notes/python-sqlalchemy.html

#### Alembic

http://alembic.zzzcomputing.com/en/latest/index.html

http://alembic.zzzcomputing.com/en/latest/tutorial.html

References for automated db migration:

https://pypi.org/project/SQLAlchemy-Utils/

https://github.com/nicfit/MishMash/blob/master/mishmash/database.py

https://github.com/zzzeek/alembic/blob/master/alembic/config.py

https://github.com/zzzeek/alembic/blob/master/alembic/command.py

#### Test/Misc

http://docs.celeryproject.org/en/latest/userguide/testing.html

https://docs.pytest.org/en/latest/
