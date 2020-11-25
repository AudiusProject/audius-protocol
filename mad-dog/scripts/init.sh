set -e
set -o xtrace

init_repos=false
link_md_deps=false
link_libs=false

# NOTE for now must be run from within ./mad-dog

# TODO
# - exit on error

# optionally init repos
if [ "$init_repos" = true ]
then
  cd ../service-commands
  sh scripts/init-repos.sh
fi

# link all deps
if [ "$link_md_deps" = true ]
then
  cd ../libs
  npm link
  cd ../service-commands
  npm link
  npm link @audius/libs
  cd ../mad-dog
  npm link @audius/libs
  npm link @audius/service-commands
fi

# optionally link from CN and IS dev servers

# stand up all services if not already
cd ../service-commands
node scripts/setup.js up -nc 3

cd ../mad-dog
echo "Run whichever maddog command you want"

set +e