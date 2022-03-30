#!/usr/bin/env bash
if [[ $(lsof -t -i:8546) ]];
  then kill -9 $(lsof -t -i:8546);
fi