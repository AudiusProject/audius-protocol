#!/bin/bash

# Make package.json with proper types for CJS and ESM
# https://www.sensedeep.com/blog/posts/2021/how-to-create-single-source-npm-module.html


# Create directories if they don't exist
mkdir -p dist/cjs dist/esm

# Create package.json for CommonJS
cat > dist/cjs/package.json <<EOL
{
  "type": "commonjs"
}
EOL

# Create package.json for ES Module
cat > dist/esm/package.json <<EOL
{
  "type": "module"
}
EOL

echo "package.json files created successfully in dist/cjs and dist/mjs."