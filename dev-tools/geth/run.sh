#!/bin/bash

docker build -t chains . --no-cache

docker run --privileged --name dev-chains -d -p 9545:8545 -p 9546:8546 chains
