
#!/bin/bash

set -e

npx changeset version

# Update package-lock.json
npm install --package-lock-only