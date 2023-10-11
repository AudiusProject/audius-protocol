#!/bin/bash
if [ -z "$1" ]
then
      echo "no version arg supplied"
      exit 1
fi

tag=$1
imagename="audius/nethermind"
imagetag="${imagename}:${tag}"

echo "Publishing audius nethermind version $imagetag to dockerhub";
echo "Login with audius dockerhub credentials";

docker login
docker buildx build --platform linux/amd64,linux/arm64 -f Dockerfile.acdc -t $imagetag --push .
