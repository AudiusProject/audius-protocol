#!/bin/sh

FIRST_RUN_FLAG="./.firstrun"

if [ ! -f "$FIRST_RUN_FLAG" ]; then
    echo "Building dist..."
    npm run build:$NETWORK

    if [ $? -eq 0 ]; then
        echo "Successfully built dist"
        touch "$FIRST_RUN_FLAG"
    else
        echo "'npm run build:$NETWORK' failed with exit code $?. Exiting..."
        exit 1
    fi
else
    echo "dist already built"
fi

exec npm run serve
