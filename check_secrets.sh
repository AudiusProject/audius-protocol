# used to exercise the `if command is not git command` logic below. change this to an invalid value to test printing out install message
COMMAND_PREFIX='secrets'

if ! git secrets > /dev/null 2>&1; then
  echo "Please install 'git-secrets' from https://github.com/awslabs/git-secrets and run 'git secrets --install' in the audius-protocol/ repo"
  exit 1
fi

# git secrets --install # this needs to be run once right after install
git secrets --register-aws

# these are the match rules to add. by default the aws rules only match AWS access id's and keys
# add any additional match strings here
# rds urls
git secrets --add '.*[a-z0-9]*.rds.amazonaws.com:[0-9]*\/.*'

# scan the repository
git secrets --scan --cached
