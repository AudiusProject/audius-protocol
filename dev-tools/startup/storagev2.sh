#!/usr/bin/env sh

# Called from within the storagev2 docker container to register the nodes

if [ "$#" -ne 1 ]; then
    echo "Usage: $0 <num_nodes>"
    exit 1
fi

if [ ! -f "/data/registered" ]; then
    num_nodes=$1

    apk add --no-cache build-base python3-dev py3-pip
    pip install 'web3==6.0.0b1'

    for i in $(seq 1 $num_nodes); do
      python3 /tmp/dev-tools/startup/register.py $i
    done

    # fast start next time
    touch /data/registered
fi

exec air
