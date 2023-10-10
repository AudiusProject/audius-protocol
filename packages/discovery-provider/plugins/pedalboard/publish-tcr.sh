#!/bin/bash
if [ -z "$1" ]
then
      echo "no version arg supplied"
      exit 1
fi

tag=$1
imagename="audius/tcr"
imagetag="${imagename}:${tag}"

echo "Publishing trending challenge rewards manually $imagetag to dockerhub";
echo "Login with audius dockerhub credentials";

docker login
docker buildx build --platform linux/amd64,linux/arm64 -f ./docker/Dockerfile --build-arg="app_name=trending-challenge-rewards" -t $imagetag --push .
