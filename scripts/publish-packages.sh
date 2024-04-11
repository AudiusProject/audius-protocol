
#!/bin/bash

set -e

# If node_modules exists in cache, run postinstall. Otherwise, run npm ci
[[ ! -d node_modules ]] || CI=true npm run postinstall
[[ -d node_modules ]] || CI=true npm ci

npx playwright install

# Ensure that all public packages are in this list,
# otherwise they won't get built/linted/tested before being published
turbo run build lint typecheck test \
    --filter=create-audius-app \
    --filter=@audius/fixed-decimal \
    --filter=@audius/harmony \
    --filter=@audius/sdk \
    --filter=@audius/spl \

changeset publish  