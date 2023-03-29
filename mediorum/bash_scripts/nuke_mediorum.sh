#!/bin/bash
# set -e

docker stop mediorum
docker rm mediorum
sudo rm -rf /var/k8s/mediorum
