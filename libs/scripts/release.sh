#!/usr/bin/env bash

set -e

# Finds the lastest commit in libs that looks like a version commit,
# and gets the list of commits after that (with PR #)
function git-libs-changelog () {
    # Find the latest release commit
    release_commit=$(git log --grep "Bump libs" -i --oneline | awk 'NR==1{print $1}')

    # Print the log as <author name> <commit message>,
    # then grab the PR # from within the () at the end of the message
    # and format it as "- (#PR) Author Name"
    git log --pretty=format:"%an %s" $release_commit..HEAD -- . \
        | awk '{print "-", $NF, "by", $1, $2}' \
        | sed -E 's/\((#.*)\)/\1/g'
}

# Makes a new branch off the master branch and bumps libs,
# commits with the relevant changelog, and pushes
function bump-libs () {
    # Make sure master is up to date
    git checkout master --ff-only
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

    # Configure git client
    git config --global user.email "audius-infra@audius.co"
    git config --global user.name "audius-infra"

    # Commit to a new branch
    git checkout -b libs-$version
    git add .
    git commit -m "Bump libs to $version

## Changelog

$(git-libs-changelog)"

    # Push to the remote
    git push -u origin libs-$version
}

function publish-libs () {
    version=$(jq -r '"v\(.version)"' package.json)

    git checkout master
    git merge --no-ff libs-$version
    # git push -u origin master

    # clean up release branches
    # git branch -d libs-$version
    # git push origin :libs-$version

    # Publish
    # npm publish . --access public
}


cd $PROTOCOL_DIR/libs
bump-libs
publish-libs