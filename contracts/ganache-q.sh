#!/usr/bin/env bash
if [[ $(lsof -t -i:8545) ]];
  then kill -9 $(lsof -t -i:8545);
fi