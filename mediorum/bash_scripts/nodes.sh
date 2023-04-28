#!/bin/bash

# discovery-4: GCP  https://discoveryprovider4.audius.co <not-registered>
# discovery-1: AWS  https://discoveryprovider.audius.co
# discovery-2: GCP  https://discoveryprovider2.audius.co
# discovery-3: GCP  https://discoveryprovider3.audius.co

# user-metadata: AWS  https://usermetadata.audius.co
# creator-1:     AWS  https://creatornode.audius.co
# creator-2:     GCP  https://creatornode2.audius.co
# creator-3:     GCP  https://creatornode3.audius.co
# creator-5:     AWS  https://content-node.audius.co

env="stage"
servers="stage-creator-5 stage-creator-6 stage-creator-7 stage-creator-8 stage-creator-9 stage-creator-10 stage-creator-11 stage-user-metadata"

# prod disabled for safety
# if [ "$1" == "prod" ]; then
#   env="prod"
#   servers="prod-creator-1 prod-creator-2 prod-creator-3 prod-creator-5 prod-user-metadata"
# fi;

echo "env=$env servers=$servers";
