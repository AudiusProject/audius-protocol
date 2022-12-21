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

# grab latest release version and generate new release version
OLD_VERSION=$(jq -r .version ${WORKDIR}/audius-protocol/discovery-provider/.version.json)
RELEASE_VERSION=$(echo ${OLD_VERSION} | awk -F. '{$NF = $NF + 1;} 1' | sed 's/ /./g')

# update .version.json to new version
JSON=${WORKDIR}/audius-protocol/discovery-provider/.version.json
jq ".version=\"${RELEASE_VERSION}\"" ${JSON} | sponge ${JSON}
JSON=${WORKDIR}/audius-protocol/creator-node/.version.json
jq ".version=\"${RELEASE_VERSION}\"" ${JSON} | sponge ${JSON}

# commit version bump and create release branch
git add */.version.json
git commit -m "Bump to version ${RELEASE_VERSION}"
RELEASE_HASH=$(git rev-parse HEAD)
git checkout -b release-v${RELEASE_VERSION}
git push origin main
git push origin release-v${RELEASE_VERSION}

function generate-changelog() {
  (
    SERVICE=${1}
    START_COMMIT=$(git show-ref --hash refs/tags/@audius/${SERVICE}@${OLD_VERSION})
    CHANGE_LOG=$(git log --pretty=format:'[%h] - %s' --abbrev-commit ${START_COMMIT}..${RELEASE_HASH} ${SERVICE})
    echo -e "Full Changelog:\n${CHANGE_LOG}"
  )
}

# create Github Releases (prerelease) + Git Tags
${WORKDIR}/ghr \
  -token ${GH_TOKEN} \
  -username AudiusProject \
  -repository audius-protocol \
  -commitish ${RELEASE_HASH} \
  -body "$(generate-changelog discovery-provider)" \
  -name "Discovery Provider ${RELEASE_VERSION}" \
  -soft \
  -prerelease \
  @audius/discovery-provider@${RELEASE_VERSION}

${WORKDIR}/ghr \
  -token ${GH_TOKEN} \
  -username AudiusProject \
  -repository audius-protocol \
  -commitish ${RELEASE_HASH} \
  -body "$(generate-changelog creator-node)" \
  -name "Creator Node ${RELEASE_VERSION}" \
  -soft \
  -prerelease \
  @audius/creator-node@${RELEASE_VERSION}
