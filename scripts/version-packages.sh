
#!/bin/bash

set -e

changeset version

# Update package-lock.json
npm install --package-lock-only