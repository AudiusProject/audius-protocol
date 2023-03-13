#!/bin/bash
set -e

make build.push.fast

# discovery-4: GCP  https://discoveryprovider4.audius.co <not-registered>
# discovery-1: AWS  https://discoveryprovider.audius.co
# discovery-2: GCP  https://discoveryprovider2.audius.co
# discovery-3: GCP  https://discoveryprovider3.audius.co

for val in discovery-4 discovery-1 discovery-2 discovery-3; do
  echo "prod-$val"
  ssh prod-$val 'bash -s' < bash_scripts/deploy_discovery.sh a1
done

# user-metadata: AWS  https://usermetadata.audius.co
# creator-1:     AWS  https://creatornode.audius.co
# creator-2:     GCP  https://creatornode2.audius.co
# creator-3:     GCP  https://creatornode3.audius.co
# creator-5:     AWS  https://content-node.audius.co

for val in creator-1 creator-2 creator-3 creator-5 user-metadata; do
  echo "prod-$val"
  ssh prod-$val 'bash -s' < bash_scripts/deploy_content.sh a1
done
