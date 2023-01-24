#!/usr/bin/env bash

set -ex

# required for ./ghr to create and tag Github Releases
if [ "${GH_TOKEN}" == "" ]; then
  echo '$GH_TOKEN not set.'
  exit 1
fi

# ensure ability to connect to Github
eval $(ssh-agent)
mkdir -p ~/.ssh/
echo "$SSH_KEY" > ~/.ssh/id_rsa
chmod 400 ~/.ssh/id_rsa
ssh-add ~/.ssh/id_*
ssh-keyscan -H github.com >> ~/.ssh/known_hosts
ssh -T git@github.com || true
git config --global user.email "audius-infra@audius.co"
git config --global user.name "audius-infra"
git config --global url."git@github.com:".insteadOf "https://github.com/"

# work in and always update the repo
cd ${WORKDIR}/audius-protocol
git pull

# grab latest release version and hash
RELEASE_VERSION=$(jq -r .version ${WORKDIR}/audius-protocol/discovery-provider/.version.json)
OLD_VERSION=$(echo ${RELEASE_VERSION} | awk -F. '{$NF = $NF - 1;} 1' | sed 's/ /./g')
git checkout release-v${RELEASE_VERSION}
RELEASE_HASH=$(git rev-parse HEAD)

function generate-changelog() {
  (
    SERVICE=${1}
    START_COMMIT=$(git show-ref --hash refs/tags/@audius/${SERVICE}@${OLD_VERSION})
    CHANGE_LOG=$(git log --pretty=format:'[%h] - %s' --abbrev-commit ${START_COMMIT}..${RELEASE_HASH} ${SERVICE})
    echo -e "Full Changelog:\n${CHANGE_LOG}"
  )
}

# recreate Github Releases (prerelease) + Git Tags
${WORKDIR}/ghr \
  -token ${GH_TOKEN} \
  -username AudiusProject \
  -repository audius-protocol \
  -commitish ${RELEASE_HASH} \
  -body "$(generate-changelog discovery-provider)" \
  -name "Discovery Provider ${RELEASE_VERSION}" \
  -delete \
  -prerelease \
  @audius/discovery-provider@${RELEASE_VERSION}

${WORKDIR}/ghr \
  -token ${GH_TOKEN} \
  -username AudiusProject \
  -repository audius-protocol \
  -commitish ${RELEASE_HASH} \
  -body "$(generate-changelog creator-node)" \
  -name "Creator Node ${RELEASE_VERSION}" \
  -delete \
  -prerelease \
  @audius/creator-node@${RELEASE_VERSION}
