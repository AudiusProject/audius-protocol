#!/bin/bash


should_error=false

echo "Checking public packages for dependencies with '*' version..."

# Find all package.json files in the current directory and its subdirectories
find . -name 'package.json' -not \( -path "./node_modules/*" -o -path "./**/node_modules/*" \) | while read -r file; do
    # Check if "private" is not set to true in the package.json file
    if ! grep -q '"private":\s*true' "$file"; then
        echo "Checking $file"
        
        # Check if any dependencies have a '*' version
        dependencies_with_star=$(jq -r '.dependencies // {} | to_entries[] | select(.value | endswith("*")) | .key' "$file")
        dev_dependencies_with_star=$(jq -r '.devDependencies // {} | to_entries[] | select(.value | endswith("*")) | .key' "$file")
        
        if [ -n "$dependencies_with_star" ] || [ -n "$dev_dependencies_with_star" ]; then
            echo "Found dependencies with '*' version in $file"
            echo "Dependencies with '*' version: $dependencies_with_star"
            echo "Dev dependencies with '*' version: $dev_dependencies_with_star"
            echo ""
            should_error=true
        fi
    fi
done

if [[ $should_error = true ]]; then
  exit 1
fi

echo "No '*' version dependencies found in public packages!"