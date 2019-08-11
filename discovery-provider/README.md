# Audius Discovery Service

The Audius discovery service indexes the contents of the audius contracts on the ethereum blockchain for clients to query. 

Here we provide a first-party implementation.

**NOTE** -- Under active development and not yet stable.

### Repository Location

This repository depends on the smart contracts generated from the audius-contracts
repository and should be one level above the audius-contracts repository

```
16:08 ~/Development
$ ll
drwxr-xr-x  20 640 Aug 14 09:35 audius-contracts
drwxr-xr-x  17 544 Aug 14 16:07 audius-discovery-provider
```

##### Docker (1st time users)

Install docker from [here (macOS, or your machine appropriate version)](https://docs.docker.com/install)

run ``` docker ``` in your terminal application to confirm the installation

[Ensure the docker daemon is running, can be started from command line or through the docker macOs gui ](https://docs.docker.com/docker-for-mac/install/#install-and-run-docker-for-mac)

## Setup

After setting up your environment, run the setup script from the root of audius-discovery-provider/ and follow instructions. 

```
(venv) 21:13 ~/Development/audius-discovery-provider 
$ ./scripts/setup.sh
```

Setup **must be run** prior to running the discovery provider as it provides the requisite contract address information (contract_config.ini) and the ABIs necessary. [Sample output](scripts/sample-setup-output.txt) for a full setup can be found in ```scripts/sample-setup-output.txt```

Every time *contracts are redeployed*, this script must be run to update the configured adresses - however, it is not necessary to run if there are no changes to the contracts repository.

This **local development script** performs the following operations (if prompted, as per output)

- Reset local blockchain
- Run all contract migrations
- Import all contract ABIs and store deployed registry address in contract_config.ini
- Perform operations on the deployed smart contracts. Currently, the script adds 4 creator entities.
- Reset postgres database (stop postgres, drop db, create db, migrate latest models)

## Running Discovery Provider

Once setup is complete, execute the following from repository root -  **all** docker-compose commands detailed within this document are expected to run in the root of audius-discovery-provider.

***
Note: If you are running the discovery service for development locally, there is also a dependency on IPFS, which must already be running on the local system. A docker-compose.ipfs.yml file is included to start this container locally, and it must be run before other processes can be run.
```
$ docker-compose -f docker-compose.ipfs.yml up -d
```
***

To run docker compose with development settings, run:

```
$ docker-compose -f docker-compose.base.yml -f docker-compose.dev.yml up --build -d
```

To run docker compose with production settings, run:
```
$ docker-compose -f docker-compose.base.yml -f docker-compose.prod.yml up --build -d
```

`--build`, builds all images before starting containers

`-d`, run application in detached mode. Removing this flag will occupy the calling terminal window.

To read about the rationale behind requiring two docker-compose files to run this service, reference [the wiki](https://audius.slab.com/posts/audius-discovery-provider-fb296bab#docker-compose)

##### Stopping discovery provider

Bring down the running discovery provider

```
# Development
$ docker-compose -f docker-compose.base.yml -f docker-compose.dev.yml stop

# Production
$ docker-compose -f docker-compose.base.yml -f docker-compose.prod.yml stop
```

##### Checking status

Check status of all components in discovery provider service:

```shell
$ docker-compose -f docker-compose.base.yml -f docker-compose.<run_level>.yml ps
             Name                            Command               State                               Ports
-----------------------------------------------------------------------------------------------------------------------------------------
audius-disc-prov_celery-beat_1    sh -c /wait && exec celery ...   Up      5000/tcp
audius-disc-prov_celery_1         sh -c /wait && exec celery ...   Up      5000/tcp
audius-disc-prov_db_1             docker-entrypoint.sh postgres    Up      0.0.0.0:5432->5432/tcp
audius-disc-prov_flask_1          sh -c /wait && exec ./scri ...   Up      0.0.0.0:5000->5000/tcp
audius-disc-prov_ipfs-node_1      /sbin/tini -- /usr/local/b ...   Up      4001/tcp, 4002/udp, 0.0.0.0:5001->5001/tcp, 8080/tcp, 8081/tcp
audius-disc-prov_redis-server_1   docker-entrypoint.sh redis ...   Up      0.0.0.0:6379->6379/tcp
```

##### ./scripts/ping.sh

A simple .sh file which pings an endpoint is provided under /scripts (/scripts/ping.sh)- this endpoint returns the list of all creators. If you added creator entities in the 'setup' step above, they should be output here.

```
14:01 ~/Development/audius-discovery-provider 
$ ./scripts/ping.sh
[{"bio":"Licunob enihu fu rislod riwzadlul azrukof powcano kicuuk omo bihwokod ukfena tu ricdafus ro cuzed uwsuco owpu.","block":{"blockhash":"0x46b65890f1df83075e314eb41ec01f368dc58e39aecd24e5b06326bc67cca25d","is_current":false,"parenthash":"0x25972a944fb78ae7e77426256e311de359977cf8b20400a7c22d1c21e576f0b0"},"blockhash":"0x46b65890f1df83075e314eb41ec01f368dc58e39aecd24e5b06326bc67cca25d","cover_photo":"162a9aee6ffa4ab833e70865e63ee8d0a5125d3c","creator_id":1,"handle":"@wugarih","is_creator":true,"location":"-62.97837", 
...
"creator_id":2,"credits_splits":"","file_multihash":"QmU2pht2Uodg6bTekgnh97NcCZEcsko2xYwW8a5kAiWxGw","file_type":"mp3","genre":"nodrib","length":4,"metadata_multihash":"QmPEHNwNjonDJ8advwqLTo3Yt9MYvNgd5RwdMnfBwwnQJZ","mood":"bak","release_date":"2/14/1982","tags":"dummy","title":"Rezheta kinobej holup","track_id":4}]
```

Sample (abridged) output:

```
$ docker-compose -f docker-compose.base.yml -f docker-compose.dev.yml up --build -d
Building celery
Step 1/13 : FROM python:3.7.0-alpine
 ---> a5f497d596f5
Step 2/13 : MAINTAINER Hareesh Nagaraj <hareesh@audius.co>
...
Step 13/13 : CMD ./scripts/flask.sh
 ---> Using cache
 ---> 94787a2ff48c
Successfully built 94787a2ff48c
Successfully tagged audius-disc-prov_celery:latest
Building celery-beat
Step 1/13 : FROM python:3.7.0-alpine
 ---> a5f497d596f5
Step 2/13 : MAINTAINER Hareesh Nagaraj <hareesh@audius.co>
...
Step 13/13 : CMD ./scripts/flask.sh
 ---> Using cache
 ---> 94787a2ff48c
Successfully built 94787a2ff48c
Successfully tagged audius-disc-prov_celery-beat:latest
Building flask
Step 1/13 : FROM python:3.7.0-alpine
 ---> a5f497d596f5
...
Step 13/13 : CMD ./scripts/flask.sh
 ---> Using cache
 ---> 94787a2ff48c
Successfully built 94787a2ff48c
Successfully tagged audius-disc-prov_flask:latest
Starting audius-disc-prov_ipfs-node_1 ... done
Starting audius-disc-prov_redis-server_1 ... done
Starting audius-disc-prov_db_1 ... done
Starting audius-disc-prov_celery-beat_1 ... done
Starting audius-disc-prov_celery_1 ... done
Starting audius-disc-prov_flask_1 ... done

...

(After exiting)
Killing audius-disc-prov_flask_1 ... done
Killing audius-disc-prov_celery_1 ... done
Killing audius-disc-prov_celery-beat_1 ... done
Killing audius-disc-prov_ipfs-node_1 ... done
Killing audius-disc-prov_redis-server_1 ... done
Killing audius-disc-prov_db_1 ... done
```

#### Docker Container

This repository is built as a base image which can be run as a docker container (known as the **discovery provider container**) - this image can be run with either **flask** or **celery**.

[READ THE WIKI page for details regarding the discovery provider container and how the image is constructed](https://audius.slab.com/posts/audius-discovery-provider-fb296bab).

### Docker Compose

The audius discovery provider is structured as a multi-container application managed with [docker-compose](https://docs.docker.com/compose/overview/). Docker compose was chosen for its environment isolation, volume management, container monitoring and portability - as well as widespread community support. 

[READ THE WIKI page for details regarding the docker-compose application structure](https://audius.slab.com/posts/audius-discovery-provider-fb296bab#docker-compose)

#### Flask

- Application endpoint for listener clients
- Returns content from local DB, queried with SQLAlchemy models 
- Relevant files: `src/app.py`, `src/queries.py`

#### Celery/Redis

- Task scheduler containing beat scheduler and worker task. Redis is used as the 'broker' for celery
- Beat Scheduler - periodically schedules index operations (`src/tasks/celery.py`)
- Worker Task - performs scheduled index operations (`src/tasks/index.py`). Is defined as a 'custom task context' and detailed further in [THE WIKI]()

#### Postgres

- Storage for content index
- Managed by Alembic/SQLAlchemy (details below)

#### Testing

* Discovery provider tests are written using the pytest framework, with fixtures provided for convenience in `tests\conftest.py`

* Cases are autodiscovered by pytest in files labeled `tests\test_*`

* Reference more information under [Useful links](#links) 

## Manual Steps

Alembic is the **only component** that must be run manually by developers, and even then it should **only be run** as necessary. For general purpose development, please use the scripts

### Alembic

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

#### docker-compose services
Instructions for running the full discovery service is available in [this section](#running-discovery-provider)

However, any of the 6 services listed in docker-compose.yml can be started and stopped invidividually with the following command:

```
$ ~/Development/audius-discovery-provider> docker-compose -f docker-compose.<level>.yml up <service-name>
```

##### Docker-compose service logs

To view logs for a single service, you can run the `docker logs -f <container name>` command. 

Monitor logs for the 'celery worker' docker service:
```
$  ~/Development/audius-discovery-provider> docker logs -f audius-disc-prov_celery-worker_1
```
`-f` continuously monitors the output of a given service.

Limit to last 1000 lines
```
$ docker logs audius-disc-prov_celery_1 --tail 1000
```

Monitor but limit to last 1000 lines
```
$ docker logs audius-disc-prov_celery_1 --tail 1000 -f
```

[Further execution options for 'docker logs' 'can be found here](https://docs.docker.com/engine/reference/commandline/logs/)

##### Ex: start the celery beat scheduler

```
$ ~/Development/audius-discovery-provider> docker-compose up celery-beat
```

##### Ex: start the celery worker task

```
$ ~/Development/audius-discovery-provider> docker-compose up celery-worker
```

- The celery beat scheduler periodically queues defined tasks to be executed. These tasks
  can be found in ```src/tasks```

- The celery worker processes queued tasks and executes them 

##### Ex: shutdown Celery:

```
$  ~/Development/audius-discovery-provider> docker-compose stop celery-worker
```

##### Local ipfs node

Discovery provider local ipfs node runs in a docker container - you can interact with said
container by using the ```docker exec``` command. 

Example with ipfs cat:

```
(venv) 11:55 ~/Development/audius-discovery-provider (hn_ipfs_tracks_indexing *)
$ docker exec audius_discprov_ipfs ipfs cat QmQRcqg7WtE3vf1xu6b1dR3CNy5YnNnCnEsztcY97AdkA2
{"creatorId":38,"name":"Nez nave ka","file_type":"mp3","file_multihash":"QmU2pht2Uodg6bTekgnh97NcCZEcsko2xYwW8a5kAiWxGw","date":"9/19/2018, 5:29:50 PM"}
```

## Docker Info

Key details surrounding discovery provider configuration can be found [ON THE WIKI](https://audius.slab.com/posts/audius-discovery-provider-fb296bab#docker-compose).

#### Commands

Run discovery provider:

```
docker-compose up --build
```

Build discovery provider without running -

```
docker-compose build
```

Build discovery provider container w/tag:

```
docker build -t audius-discprov .
```

Run single discovery provider container:

```
docker run --rm -ti audius-discprov
```

Removing volume - 

```
$ docker volume rm -f audius-disc-prov_postgres_data

Error response from daemon: remove audius-disc-prov_postgres_data: volume is in use - [cb77d644f42fa96dd48e89fc6500e0340bf750e9e4c2399417ea90bd42fa3a18, 9bad6a7f14b4213214f51d213537070ff86f947f85d2ea969eb744a27852f5a3]

$ docker rm -f cb77d644f42fa96dd48e89fc6500e0340bf750e9e4c2399417ea90bd42fa3a18
cb77d644f42fa96dd48e89fc6500e0340bf750e9e4c2399417ea90bd42fa3a18

$ docker rm -f 9bad6a7f14b4213214f51d213537070ff86f947f85d2ea969eb744a27852f5a3
9bad6a7f14b4213214f51d213537070ff86f947f85d2ea969eb744a27852f5a3

$ docker volume rm -f audius-disc-prov_postgres_data
audius-disc-prov_postgres_data
```

Connect to a running container

```
docker exec -it <container_name> /bin/bash
```

##### Postgres Docker Container Commands

SSH in to postgres docker container:

```
docker exec -it audius-disc-prov_db_1 /bin/bash
```

Following commands assume you are executing from within the container:

Start postgres (if not already running):

```
pg_ctl -D /usr/local/var/postgres -l /usr/local/var/postgres/server.log start
```

Stop postgres (note that postgres MUST be running for the discovery provider flask application, so please execute carefully):

```
pg_ctl -D /usr/local/var/postgres stop -s -m fast
```

Use this command to check if postgres is running:

```
pg_ctl -D /usr/local/var/postgres status
```

View postgres DB interactively with:

```
psql -d [db_name]

# Log in as postgres user into audius-discovery table
psql -U postgres -d audius-discovery
```

```
$ pg_config --version
PostgreSQL 10.5
```

## Testing

Tests assume that 1) a web3 provider and ipfs node are up and running on localhost port 8545 and 6001 respectively, and 2) contracts have been migrated and contract_config.ini contains the correct contract address

These conditions are handled in the `test.sh` script shown below.

Run tests with the following command (slightly abridged for readability):

```
$ ./scripts/test.sh

waiting for server to start.... done
server started
============= test session starts ===========
...

test_flask_app.py::test_creator_endpoint INFO  
INFO  [alembic.runtime.migration] Will assume transactional DDL.
INFO  [alembic.runtime.migration] Running upgrade  -> 397d4939f610, revision string
PASSED
test_index_operations.py::test_index_creator INFO 
INFO  [alembic.runtime.migration] Will assume transactional DDL.
INFO  [alembic.runtime.migration] Running upgrade  -> 397d4939f610, revision string
New Creator: Nannie Bowman
PASSED
```

### Testing Revert Logic

Until automated testing is implemented, revert logic must be tested manually. It can be tested by restarting ganache after discprov has already indexed events, and restarting discprov while preserving storage volumes. Discprov will then continue reverting blocks until it finds a blockhash intersection at 0x0.

### Code Coverage

Code coverage can be examined with the following command in repo root:

```
$ ./scripts/coverage.sh
=================== test session starts ===================
platform darwin -- Python 3.7.0, pytest-3.7.4, py-1.6.0, pluggy-0.7.1
rootdir: /Users/hareeshnagaraj/Development/audius-discovery-provider, inifile:
plugins: cov-2.6.0, celery-4.2.0
collected 2 items

tests/test_flask_app.py .                                                                                         [ 50%]
tests/test_index_operations.py .                                                                                  [100%]

---------- coverage: platform darwin, python 3.7.0-final-0 -----------
Coverage HTML written to dir cov_html
========================== 2 passed in 1.94 seconds ===========================
```

## Deploying to ECS

The docker-compose structure can be pushed up to run on AWS infrastructure. There are two ways to run containers: EC2 and Fargate. In EC2, all processes get run on an EC2 instance and cpu cycles and RAM can be allocated for each container. Fargate handles spinning up and scaling each container separately, essentially it's "Lambda" for containers. All containers perform bounded tasks and storage is ephemeral. We currently support only support EC2.

The order of operations is 
1. Build and deploy the Discprov to ECR. This is basically a private docker hub that allows you to store built images and use them in ECS.
2. Install AWS CLI and ESC-CLI tools and login 
3. Use ECS-CLI to create a cluster and deploy to ECS

ECS also looks for a new file call `ecs-params.yml`. This file defines the cpu cycles and RAM in bytes that each container can occupy in the EC2 instance. It's possible to move this to work with Fargate and scale horizontally, if we can use pull Postgres out and use RDS with read replicas. Fargate isn't currently supported in discprov because storage in Fargat
e is ephemeral. 

#### Building and deploying to ECR
Navigate to `ECS > Repositories` and create a new repository. When you create a new repo, AWS should give you commands to push to ECR. Run those commands and store the `Repository URI` after the upload finishes. The `Repository URI` goes in your docker-compose.aws.yml file as the `image` property because the `BUILD .` property isn't supported.

#### Install CLI tools
https://docs.aws.amazon.com/cli/latest/userguide/installing.html
https://docs.aws.amazon.com/AmazonECS/latest/developerguide/ECS_CLI_installation.html


#### ECS-CLI commands to deploy to EC2-ECS
For a full tutorial on how to stand up a cluster and deploy to it, go [here](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/ecs-cli-tutorial-ec2.html). 

Summary of commands included below:

```shell 
# Create a cluster of type EC2
ecs-cli configure --cluster audius-discprov-alpha-v2 --region us-west-1 --default-launch-type EC2 --config-name audius-discprov-alpha-v2

# Configure Access to the cluster by providing a key/secret pair with access to ECS 
ecs-cli configure profile --access-key <key> --secret-key <secret> --profile-name audius-discprov-alpha-v2

# Selects the size and instances
ecs-cli up --keypair audius-alpha --size 2 --instance-type t2.medium --cluster-config audius-discprov-alpha-v2 --security-group sg-0326d39c5ba9b3d6e --vpc vpc-016ae358cbd4b6fbb --subnets subnet-07ee24688fa48d242,subnet-0b9cdb23761d05e57 --instance-role ecsInstanceRole

# Add the newly created instances from the ECS cluster to a load balancer via an auto scaling group
aws autoscaling attach-load-balancer-target-groups --auto-scaling-group-name amazon-ecs-cli-setup-audius-discprov-ec2-EcsInstanceAsg-90NUZ9JT4NGC --target-group-arns arn:aws:elasticloadbalancing:us-west-1:526177477460:targetgroup/testTarget5000/fd817f2a9e028c22

# Push up the docker compose file to the ECS cluster
ecs-cli compose --file docker-compose.aws.yml up --create-log-groups --cluster-config audius-discprov-alpha-v2
```

### Links

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

### Issues

https://github.com/ethereum/web3.py/issues/730

https://github.com/trufflesuite/ganache-cli/issues/494

https://softwareengineering.stackexchange.com/questions/326517/why-is-flask-cli-recommended-over-flask-run
