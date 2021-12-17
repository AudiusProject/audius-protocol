#!/bin/bash

# Usage: setup-instance.sh [options] <service> <name>
#
# Options:
#   -p <provider>
#   -u <user>
#   -c <audius-k8s-manifests-config>
#   -r <audius-protocol-git-ref>
#   -l <audius-client-git-ref>
#   -f (fast setup with prebaked dev image)

set -e

PROTOCOL_DIR=${PROTOCOL_DIR:-$(dirname $(realpath $0))/../../}

source $PROTOCOL_DIR/service-commands/scripts/utils.sh

# parse arguments
while getopts "p:u:c:r:l:f" flag; do
	case "$flag" in
		p) provider=$OPTARG;;
		u) user=$OPTARG;;
		c) audius_k8_manifests_config=$OPTARG;;
		r) audius_protocol_git_ref=$OPTARG;;
		l) audius_client_git_ref=$OPTARG;;
		f) image=${GCP_DEV_IMAGE};;
	esac
done

service=${@:$OPTIND:1}
name=${@:$OPTIND+1:1}

# Set defaults and validate arguments
provider=${provider:-$DEFAULT_PROVIDER}
user=${user:-$DEFAULT_USER}
audius_protocol_git_ref=${audius_protocol_git_ref:-$DEFAULT_AUDIUS_PROTOCOL_GIT_REF}
audius_client_git_ref=${audius_client_git_ref:-$DEFAULT_AUDIUS_CLIENT_GIT_REF}

if [[ "$provider" != "gcp" ]] && [[ "$provider" != "azure" ]]; then
	echo "Unknown provider:" $provider
	exit 1
fi

if [[ "$service" != "creator-node" ]] && [[ "$service" != "discovery-provider" ]] && [[ "$service" != "remote-dev" ]]; then
	echo "Unknown service:" $service
	exit 1
fi

if [[ -z "$name" ]]; then
	echo "Name of instance was not provided"
	exit 1
fi

# Check dependencies
case "$provider" in
	azure)
		if [[ ! $(type az 2> /dev/null) ]]; then
			echo "az: not found"
			echo "aborting"
			exit 1
		fi
		azure_setup_defaults
		;;
	gcp)
		if [[ ! $(type gcloud 2> /dev/null) ]]; then
			echo "gcloud: not found"
			echo "aborting"
			exit 1
		fi
		gcp_set_defaults
		;;
esac

# Create instance if it does not exist
if ! instance_exists $provider $name; then
	echo "Instance does not exist. Creating it"
	if ! bash $PROTOCOL_DIR/service-commands/scripts/create-instance.sh -p $provider -i "$image" $name; then
		echo "Creation of new instance did not succeed. Aborting"
		exit 1
	fi
fi

# Setup service
case "$service" in
	creator-node)
		trap 'echo "Failed to setup audius-k8s-manifests. Aborting" && exit 1' ERR
		bash $PROTOCOL_DIR/service-commands/scripts/setup-k8s-manifests.sh -p $provider -u $user -c "$audius_k8_manifests_config" $name
		execute_with_ssh $provider $user $name "audius-cli launch creator-node --configure-ipfs"
		;;
	discovery-provider)
		trap 'echo "Failed to setup audius-k8s-manifests. Aborting" && exit 1' ERR
		bash $PROTOCOL_DIR/service-commands/scripts/setup-k8s-manifests.sh -p $provider -u $user -c "$audius_k8_manifests_config" $name
		execute_with_ssh $provider $user $name "audius-cli launch discovery-provider --seed-job --configure-ipfs"
		;;
	remote-dev)
		wait_for_instance $provider $user $name
		execute_with_ssh $provider $user $name \
			"[[ ! -d ~/audius-protocol ]]" \
			"&& set -x" \
			"&& git clone https://github.com/AudiusProject/audius-protocol.git" \
			"&& PROTOCOL_DIR=audius-protocol bash ~/audius-protocol/service-commands/scripts/set-git-refs.sh $audius_protocol_git_ref $audius_client_git_ref" \
			"&& yes | bash audius-protocol/service-commands/scripts/provision-dev-env.sh"
		reboot_instance $provider $name

		wait_for_instance $provider $user $name

		# perform once more for audius-client
		execute_with_ssh $provider $user $name \
			"bash ~/audius-protocol/service-commands/scripts/set-git-refs.sh $audius_protocol_git_ref $audius_client_git_ref"

		execute_with_ssh $provider $user $name "nohup npm run start:dev:cloud > ~/audius-client.out 2>&1 &"
		execute_with_ssh $provider $user $name "source ~/.nvm/nvm.sh; source ~/.profile; A up || (A down && A up)"

		copy_file_to_remote $provider $user $name "~/.gitconfig" "~/.gitconfig"

		configure_etc_hosts

		set_ssh_serveralive

		setup_zsh

		echo -e "\nLogin using:\n"
		echo -e "gssh $name\n"
		;;
esac
