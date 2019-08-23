#!/usr/bin/env bash

API_PORT=6001
SWARM_PORT=6002
CONTAINER_NAME=local_ipfs_node

if [[ "$1" =~ ^up|down$ ]]; then 
  echo "Local ipfs operations:"
else
  echo "Must be a valid command - ./scripts/ipfs.sh <up|down>"
  exit 1
fi

if [[ "$1" == 'up' ]]; then
  if [[ -z "$2" ]]; then
  echo "Format - ./scripts/ipfs.sh up <serviceName> <apiPort> <swarmPort>"
  exit 1
  else
    CONTAINER_NAME=$2
  fi

  if [[ -z "$3" ]]; then
  echo "Using default apiPort - $API_PORT"
  echo "Format - ./scripts/ipfs.sh up <serviceName> <apiPort> <swarmPort>"
  else
    API_PORT=$3
  fi

  if [[ -z "$4" ]]; then
  echo "Using default swarmPort - $SWARM_PORT"
  echo "Format - ./scripts/ipfs.sh up <serviceName> <apiPort> <swarmPort>"
  else
    SWARM_PORT=$4
  fi
  docker run -d --name $CONTAINER_NAME -p 127.0.0.1:$API_PORT:5001 -p 127.0.0.1:$SWARM_PORT:4001  ipfs/go-ipfs:release daemon
elif [[ "$1" == 'down' ]]; then
  if [[ -z "$2" ]]; then
  echo "Format - ./scripts/ipfs.sh up <serviceName> <apiPort> <swarmPort>"
  exit 1
  else
    CONTAINER_NAME=$2
  fi
  docker stop $CONTAINER_NAME
  docker rm $CONTAINER_NAME
fi

