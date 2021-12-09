#!/bin/bash

# Usage: setup-k8s-manifests.sh [options] <name>
#
# Options:
#   -p <provider>
#   -u <user>
#   -c <audius-k8s-manifests-config>

set -e

PROTOCOL_DIR=${PROTOCOL_DIR:-$(dirname $(realpath $0))/../../}

source $PROTOCOL_DIR/service-commands/scripts/utils.sh

# parse arguments
while getopts "p:u:c:r:l:" flag; do
	case "$flag" in
		p) provider=$OPTARG;;
		u) user=$OPTARG;;
		c) audius_k8_manifests_config=$OPTARG;;
	esac
done

name=${@:$OPTIND:1}

# Set defaults and validate arguments
provider=${provider:-$DEFAULT_PROVIDER}
user=${user:-$DEFAULT_USER}

if [[ "$provider" != "gcp" ]] && [[ "$provider" != "azure" ]]; then
	echo "Unknown provider:" $provider
	exit 1
fi

if [[ -z $name ]]; then
	echo "Name of instance was not provided"
	exit 1
fi

# setup audius-k8s-manifests
echo "Waiting for instance to start"
wait_for_instance $provider $user $name

echo "Setting up audius-k8s-manifests"
execute_with_ssh $provider $user $name \
  "git clone https://github.com/AudiusProject/audius-k8s-manifests.git" \
  "&& yes | sh audius-k8s-manifests/setup.sh"

echo "Waiting for instance to restart"
wait_for_instance $provider $user $name

if [[ ! -z "$audius_k8_manifests_config" ]]; then
	copy_file_to_remote $provider $user $name $audius_k8_manifests_config '$MANIFESTS_PATH/config.yaml'
else
	echo "Warning: config not specified or does not exist"
fi
