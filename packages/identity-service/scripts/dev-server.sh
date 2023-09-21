#!/bin/sh
set -o xtrace
set -e
 
npx ts-node-dev --respawn --inspect=0.0.0.0:9229 src/index.ts
