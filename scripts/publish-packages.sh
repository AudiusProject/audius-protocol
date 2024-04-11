
#!/bin/bash

set -e

# Ensure that all public packages are in this list,
# otherwise they won't get built/linted/tested before being published
turbo run build lint typecheck test \
    --filter=@audius/fixed-decimal \
    --filter=@audius/harmony \
    --filter=@audius/sdk \
    --filter=@audius/spl \

changeset publish  