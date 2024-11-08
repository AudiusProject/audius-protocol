# This script should be run from the Makefile only.
make_target="$1"

if [ -n "$(git status -s)" ]; then 
    echo "You have uncommitted changes. Commit them first before releasing a docker image."
    exit 1
fi

if ! which -s crane; then
    echo "No crane installation found. Run 'make install-deps' and try again."
    exit 1
fi

case "$make_target" in
    core-force-release-stage)
        img_tag=prerelease
        ;;
    core-force-release-foundation)
        img_tag=edge
        ;;
    core-force-release-sps)
        img_tag=current
        ;;
    *)
        exit 1
        ;;
esac

CURRENT_SHA=$(git rev-parse HEAD)

DOCKER_DEFAULT_PLATFORM=linux/amd64 audius-compose push --prod "core"
crane copy "audius/core:${CURRENT_SHA}" "audius/core:${img_tag}"
