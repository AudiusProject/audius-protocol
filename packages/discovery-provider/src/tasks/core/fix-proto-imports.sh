#!/bin/bash

# Directory to search for Python files (set to neighboring 'gen' directory)
DIR="./audiusd_gen"

# List your own proto package roots here (add more as needed)
PKGS="core storage etl system ddex"

for PKG in $PKGS; do
  # Replace imports like 'from core.v1 import types_pb2 as ...' or 'from ddex.v1beta1 import release_pb2 as ...'
  find "$DIR" -type f -name "*.py" | while read -r file; do
    sed -i '' -E "s/^from $PKG(\.[a-zA-Z0-9_]+)* import ([a-zA-Z0-9_]+) as (.*)$/from src.tasks.core.audiusd_gen.$PKG\1 import \2 as \3/" "$file"
  done
  # Also handle imports without 'as' (rare, but possible)
  find "$DIR" -type f -name "*.py" | while read -r file; do
    sed -i '' -E "s/^from $PKG(\.[a-zA-Z0-9_]+)* import ([a-zA-Z0-9_]+)$/from src.tasks.core.audiusd_gen.$PKG\1 import \2/" "$file"
  done
done

# Ensure __init__.py in all dirs
find "$DIR" -type d -exec touch {}/__init__.py \;

echo "Finished updating import lines for your proto packages only."
