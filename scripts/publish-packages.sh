
#!/bin/bash

set -e

npm i

npx playwright install

# Ensure that all public packages are in this list,
# otherwise they won't get built/linted/tested before being published
npx turbo run build lint typecheck test \
    --filter=create-audius-app \
    --filter=@audius/fixed-decimal \
    --filter=@audius/harmony \
    --filter=@audius/sdk \
    --filter=@audius/spl \

npx changeset publish  