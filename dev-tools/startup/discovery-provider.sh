#!/usr/bin/env sh

# Run register script in background
./scripts/register.py &

# Create sender for current DN
../../node_modules/.bin/ts-node ./scripts/createSender.ts ${replica} &
