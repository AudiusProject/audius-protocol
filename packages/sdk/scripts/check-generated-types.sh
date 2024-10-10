#!/bin/bash
set -e
npm run gen:dev
cd ./src/sdk/api/generated

# Check if there are any changes generated
if [ -z "$(git status . --porcelain)" ]; then 
    printf '%s\n' "No diff found between generated types and checked in types"
else
    printf '%s\n' "Found diff between generated types and checked in types, please 'npm run gen:dev' in libs" >&2
    git --no-pager diff .
    exit 1    
fi
