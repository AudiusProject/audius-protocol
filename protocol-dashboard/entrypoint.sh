#!/bin/bash

FIRST_RUN_FLAG="/.firstrun"

# Check if the container is starting for the first time
if [ ! -f "$FIRST_RUN_FLAG" ]; then
    echo "Building dist..."
    npm run build:$NETWORK

    if [ $? -eq 0 ]; then
        echo "Successfully built dist"
        touch "$FIRST_RUN_FLAG"
    else
        echo "'npm run build:prod' failed with exit code $?. Exiting..."
        exit 1
    fi
else
    echo "dist already built"
fi

exec npm run serve
