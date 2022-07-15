#!/usr/bin/env bash

set -ex

# Finds the lastest commit in libs that looks like a version commit,
# and gets the list of commits after that (with PR #)
function git-libs-changelog () {
    # Find the latest release commit by using the last time the first `version` key changed
    version_line_number=$(grep -m 1 -n version package.json | cut -d: -f 1)
    release_commit=$(git blame -L ${version_line_number},+1 --porcelain -- package.json | awk 'NR==1{ print $1 }')

    # Print the log as <author name> <commit message>,
    # then grab the PR # from within the () at the end of the message
    # and format it as "- (#PR) Author Name"
    git log --pretty=format:"- %cd [%h] %s %an" --date=short $release_commit..HEAD
}

# Makes a new branch off the master branch and bumps libs,
# commits with the relevant changelog, and pushes
function bump-libs () {
    # Configure git client
    git config --global user.email "audius-infra@audius.co"
    git config --global user.name "audius-infra"

    # Make sure master is up to date
    git checkout master -f
    git pull

    # Working directory clean
    git reset --hard origin/master

    # Patch the version
    version=$(npm version patch)

    # Build libs
    npm i
    npm run build

    # Publishing dry run
    npm publish . --access public --dry-run

    # Commit to a new branch
    git checkout -b libs-$version
    git add .
    git commit -m "Bump libs to $version\n\n## Changelog\n\n${CHANGE_LOG}"

    # Push to the remote
    git push -u origin libs-$version
}

function merge-bump () {
    version=$(jq -r '"v\(.version)"' package.json)

    git checkout master -f
    git pull
    git merge --no-ff libs-$version -m "Bump libs to $version\n\n## Changelog\n\n${CHANGE_LOG}"

    # git push -u origin master

    # clean up release branches
    # git branch -d libs-$version
    # git push origin :libs-$version
}

function publish-libs () {
    # Publish
    npm publish . --access public
}


cd $PROTOCOL_DIR/libs
CHANGE_LOG=$(git-libs-changelog)
bump-libs
merge-bump
# publish-libs
