
#!/bin/bash

set -e

echo "Updating package versions..."
npm run changeset version

# Update package-lock.json
echo "Updating package-lock.json..."
npm install --package-lock-only