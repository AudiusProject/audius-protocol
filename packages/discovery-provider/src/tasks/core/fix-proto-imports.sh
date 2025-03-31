#!/bin/bash

# Directory to search for Python files (set to neighboring 'gen' directory)
DIR="./gen"

# Find all Python files and update the import line
find "$DIR" -type f -name "*.py" | while read -r file; do
    sed -i '' "s/^import protocol_pb2 as protocol__pb2$/from . import protocol_pb2 as protocol__pb2/" "$file"
done

echo "Finished updating import lines."
