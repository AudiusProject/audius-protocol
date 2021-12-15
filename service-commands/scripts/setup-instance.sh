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
		f) image=${GCP_DEV_IMAGE};;
	esac
done

service=${@:$OPTIND:1}
name=${@:$OPTIND+1:1}

# Set defaults and validate arguments
provider=${provider:-$DEFAULT_PROVIDER}
user=${user:-$DEFAULT_USER}
audius_protocol_git_ref=${user:-$DEFAULT_AUDIUS_PROTOCOL_GIT_REF}
audius_client_git_ref=${user:-$DEFAULT_AUDIUS_CLIENT_GIT_REF}

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


configure_etc_hosts() {
	read -p "Configure local /etc/hosts? [y/N] " -n 1 -r && echo
	if [[ "$REPLY" =~ ^[Yy]$ ]]; then
		IP=$(get_ip_addr $provider $name)
		echo "export AUDIUS_REMOTE_DEV_HOST=${IP}" >> ~/.zshenv
		sudo -E AUDIUS_REMOTE_DEV_HOST=${IP} node $PROTOCOL_DIR/service-commands/scripts/hosts.js add-remote-host
	fi
}

set_ssh_serveralive() {
	if [[ ! -f "/etc/ssh/ssh_config.d/60-audius.conf" ]]; then
		read -p "Set SSH ServerAliveInterval to 60? [y/N] " -n 1 -r && echo
		if [[ "$REPLY" =~ ^[Yy]$ ]]; then
			echo "ServerAliveInterval 60" | sudo tee -a /etc/ssh/ssh_config.d/60-audius.conf
		fi
	fi
}

setup_zsh() {
	read -p "Setup zsh? [y/N] " -n 1 -r && echo
	if [[ "$REPLY" =~ ^[Yy]$ ]]; then
		execute_with_ssh $provider $user $name 'sudo chsh -s /bin/zsh $USER'

		cp ~/.zshenv ~/.zshenv.tmp
		echo "export PROTOCOL_DIR=$HOME/audius-protocol" >> ~/.zshenv.tmp
		copy_file_to_remote $provider $user $name '~/.zshenv.tmp' '~/.zshenv'
		rm ~/.zshenv.tmp

		copy_file_to_remote $provider $user $name '~/.zshrc' '~/.zshrc'
		if [[ -f "~/.p10k.zsh" ]]; then
			copy_file_to_remote $provider $user $name '~/.p10k.zsh' '~/.p10k.zsh'
		fi
	fi
}

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
			"&& git clone https://github.com/AudiusProject/audius-protocol.git" \
			"&& yes | bash audius-protocol/service-commands/scripts/provision-dev-env.sh" \
			"&& yes | bash audius-protocol/service-commands/scripts/set-git-refs.sh $audius_protocol_git_ref $audius_client_git_ref"

		wait_for_instance $provider $user $name
        reboot_instance $provider $name

		configure_etc_hosts

		set_ssh_serveralive

		setup_zsh
		;;
esac
