#!/bin/bash
# set -e

for val in storage nats comms; do
  echo "NUKE $val"
  docker stop $val
  docker rm $val
  # sudo rm -rf /var/k8s/nats
done

