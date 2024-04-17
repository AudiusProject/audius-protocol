# This file defines which directories are included in changelogs for
# client and protocol releases
#
# Source this file in your shell to get the relevant directories
# for client and protocol releases
# ./set-release-directories.sh
#
# You can then generate a changelog, for example:
# git log -- $CLIENT_DIRECTORIES

export CLIENT_DIRECTORIES="packages/web
    packages/fixed-decimal \
    packages/common \
    packages/mobile \
    packages/harmony \
    packages/libs"

export PROTOCOL_DIRECTORIES="mediorum \
    packages/discovery-provider \
    packages/identity-service \
    packages/ddex* \
    comms \
    monitoring/healthz \
    monitoring/uptime \
    protocol-dashboard"