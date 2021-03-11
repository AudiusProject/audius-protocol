#!/usr/bin/env bash

set -o xtrace
set -e

IPFS_CONTAINER=cn-test-ipfs-node
DB_CONTAINER='cn_test_db'
REDIS_CONTAINER='cn_test_redis'

PG_PORT=$POSTGRES_TEST_PORT
if [ -z "${PG_PORT}" ]; then
  PG_PORT=4432
fi

export storagePath='./test_file_storage'
export logLevel='info'
export printSequelizeLogs=false

tear_down () {
  set +e
  docker container stop $IPFS_CONTAINER
  docker container stop $DB_CONTAINER
  docker container stop $REDIS_CONTAINER
  docker container rm $IPFS_CONTAINER
  docker container rm $DB_CONTAINER
  docker container rm $REDIS_CONTAINER
  docker volume prune -f
  set -e
}

run_unit_tests () {
  echo Running unit tests...
  ./node_modules/mocha/bin/mocha --recursive 'src/**/*.test.js' --exit
}

run_integration_tests () {
  echo Running integration tests...
  # ./node_modules/mocha/bin/mocha test/snapbackSM.test.js --timeout 30000 --exit
  ./node_modules/mocha/bin/mocha test/*.test.js --timeout 30000 --exit
}

if [ "$1" == "standalone_creator" ]; then
  export ipfsPort=6901
  export redisPort=4377
  PG_PORT=1432
  # Ignore error on create audius_dev network
  IPFS_EXISTS=$(docker ps -q -f status=running -f name=^/${IPFS_CONTAINER}$)
  DB_EXISTS=$(docker ps -q -f status=running -f name=^/${DB_CONTAINER}$)
  REDIS_EXISTS=$(docker ps -q -f status=running -f name=^/${REDIS_CONTAINER}$)

  if [ ! "${IPFS_EXISTS}" ]; then
    echo "IPFS Container doesn't exist"
    docker run -d --name $IPFS_CONTAINER -p 127.0.0.1:$ipfsPort:5001 ipfs/go-ipfs:v0.4.23 daemon
  fi

  if [ ! "${DB_EXISTS}" ]; then
    echo "DB Container doesn't exist"
    docker run -d --name $DB_CONTAINER -p 127.0.0.1:$PG_PORT:5432 postgres:11.1
    sleep 1
  fi
  if [ ! "${REDIS_EXISTS}" ]; then
    echo "Redis Container doesn't exist"
    docker run -d --name $REDIS_CONTAINER -p 127.0.0.1:$redisPort:6379 redis:5.0.4
    sleep 1
  fi
elif [ "$1" == "teardown" ]; then
  tear_down
elif [ "$1" == "unit_test" ]; then
  run_unit_tests
  exit
fi


export dbUrl="postgres://postgres:postgres@localhost:$PG_PORT/audius_creator_node_test"

# Locally, the docker-compose files set up a database named audius_creator_node. For
# tests, we use audius_creator_node_test. The below block checks if
# audius_creator_node_test exists in creator node 1, and if not, creates it (the tests will fail if this
# database does not exist). If psql is not installed (ex. in CircleCI), this command will
# fail, so we check if it is installed first.
# In CircleCI, the docker environment variables set up audius_creator_node_test instead of
# audius_creator_node.

# CircleCI job and docker run in separate environments and cannot directly communicate with each other.
# Therefore the 'docker exec' command will not work when running the CI build.
# https://circleci.com/docs/2.0/building-docker-images/#separation-of-environments
# So, if tests are run locally, run docker exec command. Else, run the psql command in the job.
if [ -z "${isCIBuild}" ]; then
  docker exec -i $DB_CONTAINER /bin/sh -c "psql -U postgres -tc \"SELECT 1 FROM pg_database WHERE datname = 'audius_creator_node_test'\" | grep -q 1 || psql -U postgres -c \"CREATE DATABASE audius_creator_node_test\""
fi

mkdir -p $storagePath

# linter
./node_modules/.bin/standard

# setting delegate keys for app to start
export delegateOwnerWallet="0x1eC723075E67a1a2B6969dC5CfF0C6793cb36D25"
export delegatePrivateKey="0xdb527e4d4a2412a443c17e1666764d3bba43e89e61129a35f9abc337ec170a5d"
export creatorNodeEndpoint="http://localhost:5000"
export spOwnerWallet="0x1eC723075E67a1a2B6969dC5CfF0C6793cb36D25"

# tests
run_unit_tests
run_integration_tests

rm -r $storagePath

# remove test generated segments folder and .m3u8 file
rm -rf "./test/segments"
rm -rf "./test/testTrack.m3u8"

if [ "$2" == "teardown" ]; then
  tear_down
fi