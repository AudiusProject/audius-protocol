# . update-content-blacklist.sh <action> <type> <id>
# . update-content-blacklist.sh add user 1
# . update-content-blacklist.sh delete track 5

# Set env vars
. ./compose/env/commonEnv1.sh

# Make changes to ContentBlacklist
node ./scripts/updateContentBlacklist.js $1 $2 $3