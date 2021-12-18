#!/usr/bin/env bash

# Usage: setup-instance.sh [options] <service> <name>
#
# Options:
#   -p <provider>
#   -u <user>
#   -c <audius-k8s-manifests-config>
#   -r <audius-protocol-git-ref>
#   -l <audius-client-git-ref>
#   -f (fast setup with prebaked dev image)
#   -y (assume yes and do not prompt for manual confirm)

set -ex

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
		f) image=${GCP_DEV_IMAGE}; fast=1;;
		y) skip_confirm=1;;
	esac
done

service=${@:$OPTIND:1}
name=${@:$OPTIND+1:1}

# Set defaults and validate arguments
provider=${provider:-$DEFAULT_PROVIDER}
user=${user:-$DEFAULT_USER}
audius_protocol_git_ref=${audius_protocol_git_ref:-$DEFAULT_AUDIUS_PROTOCOL_GIT_REF}
audius_client_git_ref=${audius_client_git_ref:-$DEFAULT_AUDIUS_CLIENT_GIT_REF}
skip_confirm=${skip_confirm:-0}

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
	if [ "${fast:-0}" -eq "1" ]; then
		echo "Defrosting prebaked image for provisioning... $image"
	fi
	if ! bash $PROTOCOL_DIR/service-commands/scripts/create-instance.sh -p $provider -i "$image" -y $skip_confirm $name; then
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
		echo "Waiting for instance $name on $provider to be ready for ssh connections... You may see some SSH connection errors during this time but instance should eventually come up."
		if [ "${fast:-0}" -eq "0" ]; then
			execute_with_ssh $provider $user $name \
				"[[ ! -d ~/audius-protocol ]]" \
				"&& git clone --branch $audius_protocol_git_ref https://github.com/AudiusProject/audius-protocol.git" \
				"&& yes | bash audius-protocol/service-commands/scripts/provision-dev-env.sh $audius_protocol_git_ref $audius_client_git_ref"

			wait_for_instance $provider $user $name
			reboot_instance $provider $name
			wait_for_instance $provider $user $name
			# TODO fix install and provisioning for fast
		fi

		# configure local files: /etc/hosts
		configure_etc_hosts

		# upload personal files: ~/.gitconfig
		upload_gitconfig

		echo -e "\nLogin using:\n"
		echo -e "gcloud compute ssh $user@$name\n"

		IP=$(get_ip_addr $provider $name)
		echo -e "\nRun the following to create an SSL tunnel to allow the client into the remote-dev box:\n"
		echo -e "ssh -N -L 3000:127.0.0.1:3000 -i ~/.ssh/google_compute_engine ubuntu@${IP}\n"
		;;
esac
