#!/bin/bash
# Usage: create-instance.sh {azure,gcp} <user> <name> <config> <service>

# Set options to exit on error
set -e
set -o pipefail

echoerr() {
	echo "$@" 1>&2
}

if [[ $# != 5 ]]; then
	echoerr "Expected 5 arguments got $# argument(s)"
	exit 1
fi

provider=${1,,}
user=$3
name=$4
config=$2
serivce=$5

ssh_args=''

case $provider in
	azure)
		ssh_args="az ssh vm --vm-name $name"
		;;
	gcp)
		ssh_args="gcloud compute ssh $user@$name --"
		;;
	raw)
		ssh_args="ssh $user@$name"
		;;
	*)
		echoerr "Unknown Provider: $provider"
		exit 1
esac

echo "Waiting for instance to start"
while ! eval $ssh_args ':'; do
	sleep 1
done

echo "Setting up audius-k8s-manifests"
eval $ssh_args <<EOF
git clone https://github.com/AudiusProject/audius-k8s-manifests.git
yes | sh audius-k8s-manifests/setup.sh
EOF

echo "Waiting for instance to restart"
while ! eval $ssh_args ':'; do
	sleep 1
done

if [[ $config != "-" && -f $config ]]; then
	cat $config | eval $ssh_args 'cat > $MANIFESTS_PATH/config.yaml'
else
	echo "Warning: config not specified or does not exist"
fi

case $service in
	creator-node)
		eval $ssh_args "audius-cli launch creator-node --configure-ipfs"
		;;
	discovery-provider)
		eval $ssh_args "audius-cli launch discovery-provider --seed-job --configure-ipfs"
		;;
	remote-dev)
		echoerr "Use setup-remote-dev.sh instead for setting up remote dev"
		exit 1
		;;
	*)
		echoerr "Unknown Service: $service"
		exit 1
esac
