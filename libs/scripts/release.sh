#!/usr/bin/env bash

if [[ -z ${1} ]]; then
    echo "A git tag must be supplied as the first parameter."
    exit 1
else
    GIT_TAG=${1}
fi

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
    git log --pretty=format:"- %cd [%h] %s [%an]" --date=short $release_commit..HEAD
}

# formats a commit message using the bumped ${VERSION} and ${CHANGE_LOG}
function commit-message () {
    echo "Bump ${STUB} to ${VERSION}

## Changelog

${CHANGE_LOG}"
}

# Make a new branch off GIT_TAG, bumps npm,
# commits with the relevant changelog, and pushes
function bump-npm () {
    # Configure git client
    git config --global user.email "audius-infra@audius.co"
    git config --global user.name "audius-infra"

    # Make sure master is up to date
    git checkout master -f
    git pull

    # only allow tags/commits found on master, release branches, or tags to be deployed
    git branch -a --contains ${GIT_TAG} \
        | tee /dev/tty \
        | grep -Eq 'remotes/origin/master|remotes/origin/release' \
        || (
            echo "tag not found on master nor release branches"
            exit 1
        )

    # Ensure working directory clean
    git reset --hard ${GIT_TAG}

    # grab change log early, before the version bump
    LAST_RELEASED_SHA=$(jq -r '.audius."last-released-sha"' package.json)
    CHANGE_LOG=$(git-changelog ${LAST_RELEASED_SHA})

    # Patch the version
    VERSION=$(npm version patch)
    jq ". += {audius: {\"last-released-sha\": \"${GIT_TAG}\"}}" package.json \
        | sponge package.json

    # Build project
    npm i
    npm run build

    # Publishing dry run, prior to pushing a branch
    npm publish . --access public --dry-run

    # Commit to a new branch, and tag
    git checkout -b ${STUB}-${VERSION}
    git add .
    git commit -m "$(commit-message)"
    git tag -a @audius/${STUB}@${VERSION} -m "$(commit-message)"

    # Push branch and tags to remote
    git push -u origin ${STUB}-${VERSION}
    git push origin --tags
}

# Merge the created branch into master, then delete the branch
function merge-bump () {
    git checkout master -f

    # pull in any additional commits that may have trickled in
    git pull

    git merge ${STUB}-${VERSION} -m "$(commit-message)"

    # if pushing fails, ensure we cleanup()
    git push -u origin master \
    && git push origin :${STUB}-${VERSION} \
    || $(exit 1)
}

# publish to npm
function publish () {
    npm publish . --access public
}

# cleanup when merging step fails
function cleanup () {
    git push origin :${STUB}-${VERSION} || true
    git push --delete origin @audius/${STUB}@${VERSION} || true
    exit 1
}

# configuration
STUB=sdk
cd ${PROTOCOL_DIR}/libs

# perform release
bump-npm
merge-bump && publish || cleanup
