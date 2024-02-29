#!/usr/bin/env bash

if [[ -z ${1} ]]; then
    echo "A git commit must be supplied as the first parameter."
    exit 1
else
    GIT_COMMIT=${1}
fi

if [[ -z ${2} ]]; then
    echo "A version must be supplied as the second parameter (See `npm version` for valid values)."
    exit 2
else
    RELEASE_VERSION=${2}
fi

PREID=${3}

if [[ $(whoami) != "circleci" ]]; then
    echo "This script is intended to be run through CI."
    echo "Please see:"
    echo "    .circleci/bin/deploy-sdk.sh -h"
    exit 1
fi

set -ex

# Generate change log between last released sha and HEAD
function git-changelog () {
    release_commit=${1}

    # Print the log as "- <commmiter short date> [<commit short hash>] <commit message> <author name>"
    git log --pretty=format:"- %cd [%h] %s [%an]" --date=short $release_commit..HEAD .
}

# formats a commit message using the bumped ${VERSION} and ${CHANGE_LOG}
function commit-message () {
    echo "${STUB}: ${VERSION}

[skip ci]
## Changelog

${CHANGE_LOG}"
}

# Pull in main, ensure commit is on main, ensure clean build environment
function git-reset () {
    (
        # Configure git client
        git config --global user.email "audius-infra@audius.co"
        git config --global user.name "audius-infra"

        # Make sure main is up to date
        git checkout main -f
        git pull

        if [[ "${GIT_COMMIT}" == "main" ]]; then
            echo "Commit cannot be 'main'."
            exit 1
        fi

        # only allow commits found on main or release branches to be deployed
        echo "commit has to be on main or a release branch"
        git branch -a --contains ${GIT_COMMIT} \
            | tee /dev/tty \
            | grep -Eq 'remotes/origin/main|remotes/origin/release' \
            || exit 1

        # Ensure working directory clean
        git reset --hard ${GIT_COMMIT}
    )
}

# Make a new branch off GIT_COMMIT, bumps npm,
# commits with the relevant changelog, and pushes
function bump-version () {
    (
        # Patch the version
        npm version ${RELEASE_VERSION} --preid=${PREID}
        VERSION=v$(jq -r '.version' package.json)
        tmp=$(mktemp)
        jq ". += {audius: {releaseSHA: \"${GIT_COMMIT}\"}}" package.json > "$tmp" \
            && mv "$tmp" package.json

        # Build project
        npx turbo run build

        # Publishing dry run, prior to pushing a branch
        npm publish . --access public --dry-run

        # Commit to a new branch
        git checkout -b ${STUB}-${VERSION}
        git add .
        git commit -m "$(commit-message)"

        # Push branch to remote
        git push -u origin ${STUB}-${VERSION}
    )
}

# Merge the created branch into main, then delete the branch
function merge-bump () {
    (
        git checkout main -f

        # pull in any additional commits that may have trickled in
        git pull

        # squash branch commit
        git merge --squash ${STUB}-${VERSION} || exit 1
        git commit -m "$(commit-message)" || exit 1

        # tag release
        git tag -a @audius/${STUB}@${VERSION} -m "$(commit-message)" || exit 1
        git push origin --tags || exit 1

        # if pushing fails, ensure we cleanup()
        git push -u origin main || exit 1
        git push origin :${STUB}-${VERSION}
    )
}

# publish to npm
function publish () {
    if [[ -z $PREID ]]; then
        npm publish . --access public
    else
        npm publish . --access public --tag ${PREID}
    fi
}

# informative links
function info () {
    echo "Released to:
      https://github.com/AudiusProject/audius-protocol/commits/main
      https://github.com/AudiusProject/audius-protocol/tags
      https://www.npmjs.com/package/@audius/sdk?activeTab=versions"
}

# cleanup when merging step fails
function cleanup () {
    git push origin :${STUB}-${VERSION} || true
    git push --delete origin @audius/${STUB}@${VERSION} || true
    exit 1
}

# configuration
STUB=@audius/sdk
cd ${PROTOCOL_DIR}/packages/libs

# pull in main
git-reset

# grab change log early, before the version bump
LAST_RELEASED_SHA=$(jq -r '.audius.releaseSHA' package.json)
CHANGE_LOG=$(git-changelog ${LAST_RELEASED_SHA})

# perform version bump and perform publishing dry-run
bump-version

# grab VERSION again since we escaped the bump-version subshell
VERSION=v$(jq -r '.version' package.json)

merge-bump && publish && info || cleanup
