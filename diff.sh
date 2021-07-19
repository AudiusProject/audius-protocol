#! /bin/bash

# -- diff.sh --
# a tool to report which repos have modifications (wrt DIFF_BRANCH) within this monorepo
#
#   usage
#   $ ./diff.sh [dirname]

#   return all changed dirs if no input <dirname>;
#   exit 0 if <dirname> and ./dirname has been modified, else exit 1
#
# can be used as a precondition for working with the monorepo
# i.e. $ ./diff.sh identity-service || circleci-agent step halt

DIFF_BRANCH="origin/master"
REPOS="
    libs
    content-service
    contracts
    eth-contracts
    creator-node
    discovery-provider
    e2e-tests
    identity-service
    solana-programs
"

declare -a diff_repos

for d in $(git diff $DIFF_BRANCH --dirstat=files)
do
    d=$(echo $d | cut -d/ -f1)
    if [ -d $d  ]
    then
        for r in $REPOS
        do
            if [ $r == $d ]
            then
                diff_repos+=($r)
            fi
        done
    fi
done

# remove duplicates
diff_repos=$(echo ${diff_repos[@]} | tr ' ' '\n' | sort -u)

if [ $1 ]
then
    for r in $diff_repos
    do
        if [ $r == $1 ]
        then
            exit 0
        fi
    done
    exit 1
else
    echo $diff_repos
fi
