#!/usr/bin/env bash

# ONLY TO BE RUN ON MASTER
# master is assumed when using -f and --hard git parameters

set -ex

GIT_TAG=${1}

# Finds the lastest commit that looks like a version commit,
# and gets the list of commits after that
function git-changelog () {
    # Find the latest release commit by using the last time the first `version` key changed
    version_line_number=$(grep -m 1 -n version package.json | cut -d: -f 1)
    release_commit=$(git blame -L ${version_line_number},+1 --porcelain -- package.json | awk 'NR==1{ print $1 }')

    # Print the log as "- <commmiter short date> [<commit short hash>] <commit message> <author name>"
    git log --pretty=format:"- %cd [%h] %s [%an]" --date=short $release_commit..HEAD
}

# formats a commit message using the bumped ${VERSION} and ${CHANGE_LOG}
function commit-message () {
    echo "Bump ${STUB} to ${VERSION}

## Changelog

${CHANGE_LOG}"
}

# Make a new branch off the master branch, bumps npm,
# commits with the relevant changelog, and pushes
function bump-npm () {
    # Configure git client
    git config --global user.email "audius-infra@audius.co"
    git config --global user.name "audius-infra"

    # Make sure master is up to date
    git checkout master -f
    git pull

    # Ensure working directory clean
    git reset --hard ${GIT_TAG}

    # grab change log early, before the version bump
    CHANGE_LOG=$(git-changelog)

    # Patch the version
    VERSION=$(npm version patch)

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
    git merge ${STUB}-${VERSION} -m "$(commit-message)"

    # git push -u origin master

    # clean up release branches
    # git push origin :${STUB}-${VERSION}
}

# publish to npm
function publish () {
    echo
    # npm publish . --access public
}

# configuration
STUB=sdk
cd ${PROTOCOL_DIR}/libs

# perform release
bump-npm
merge-bump
publish
