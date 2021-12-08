#!/bin/bash

# Usage: create-instance.sh [options] <name> 
#
# Options:
#   -p <provider>
#   -i <image>
#   -d <disk-size>
#   -m <machine-type>

set -e

PROTOCOL_DIR=${PROTOCOL_DIR:-$(dirname $(realpath $0))/../../}

source $PROTOCOL_DIR/service-commands/scripts/utils.sh

# parse arguments
while getopts "p:i:d:m:" flag; do
	case "$flag" in
		p) provider=$OPTARG;;
		i) image=$OPTARG;;
		d) disk_size=$OPTARG;;
		m) machine_type=$OPTARG;;
	esac
done

name=${@:$OPTIND:1}

# Set defaults and validate arguments
provider=${provider:-$DEFAULT_PROVIDER}
disk_size=${disk_size:-$DEFAULT_DISK_SIZE}

case "$provider" in
	azure)
		image=${image:-$DEFAULT_AZURE_IMAGE}
		machine_type=${machine_type:-$DEFAULT_AZURE_MACHINE_TYPE}
		;;
	gcp)
		image=${image:-$DEFAULT_GCP_IMAGE}
		machine_type=${machine_type:-$DEFAULT_GCP_MACHINE_TYPE}
		;;
	*)
		echo "Unknown Provider:" $provider
		exit 1
		;;
esac

if [[ -z "$name" ]]; then
	echo "Name for instance was not provided"
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
		azure_set_defaults
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

# Confirm choices
echo "$(tput bold)Provider:$(tput sgr0)" $provider
echo "$(tput bold)OS Image:$(tput sgr0)" $image
echo "$(tput bold)Disk Size:$(tput sgr0)" $disk_size
echo "$(tput bold)Machine Type:$(tput sgr0)" $machine_type
echo "$(tput bold)Name:$(tput sgr0)" $name

case "$provider" in
	azure)
		echo "$(tput bold)Account:$(tput sgr0)" $(get_azure_account)
		echo "$(tput bold)Subscription:$(tput sgr0)" $(get_azure_subscription)
		echo "$(tput bold)Resource Group:$(tput sgr0)" $(get_azure_resource_group)
		;;
	gcp)
		echo "$(tput bold)Account:$(tput sgr0)" $(get_gcp_account)
		echo "$(tput bold)Project:$(tput sgr0)" $(get_gcp_project)
		;;
esac

read -p "Confirm Options? [y/N] " -n 1 -r && echo
if [[ ! "$REPLY" =~ ^[Yy]$ ]]; then
	exit 1
fi

# Create the instance
case "$provider" in
	azure)
		az vm create --name $name --image $image --os-disk-size-gb $disk_size --size $machine_type --public-ip-sku Basic --ssh-key-values ~/.ssh/audius-azure
		;;
	gcp)
		gcloud compute instances create $name $(gcp_image_to_flags $image) --boot-disk-size $disk_size --machine-type $machine_type 2> /dev/null
		;;
esac
