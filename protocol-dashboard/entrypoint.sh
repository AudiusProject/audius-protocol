#!/bin/sh

if [ ! -d "./dist" ]; then
    echo "Building dist..."
    npm run build:$NETWORK

    if [ $? -eq 0 ]; then
        echo "Successfully built dist"
    else
        echo "'npm run build:$NETWORK' failed with exit code $?. Exiting..."
        exit 1
    fi
else
    echo "dist already built"
fi

exec npm run serve
