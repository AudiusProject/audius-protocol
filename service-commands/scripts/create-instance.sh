#!/bin/bash
# Usage: create-instance.sh {azure,gcp} <image> <disk-size> <machine-type> <name>
# image must be specified in the format [project=<project>],[family=<family>],[image=<image>] on gcp

# Set options to exit on error
set -e
set -o pipefail

echoerr() {
	echo "$@" 1>&2
}

get_azure_account() {
	az account list --query '[?isDefault] | [0].user.name' -o tsv
}

get_azure_subscription() {
	az account list --query '[?isDefault] | [0].name' -o tsv
}

get_azure_resource_group() {
	az config get defaults.group
}

gcp_image_to_flags() {
	echo $1 | sed 's/\(^\|,\)project=/ --image-project=/; s/\(^\|,\)family=/ --image-family=/; s/\(^\|,\)image=/ --image=/'
}

confirm() {
	read -p "Confirm Options? [y/N] " -n 1 -r && echo
	if [[ $REPLY =~ ^[Yy]$ ]]; then
		return 0
	fi
	return 1
}

if [[ $# != 5 ]]; then
	echoerr "Expected 5 arguments got $# argument(s)"
	exit 1
fi

provider=${1,,}
image=$2
disk_size=$3
machine_type=$4
name=$5

case $provider in
	azure)
		echo "$(tput bold)Provider:       $(tput sgr0)" $provider
		echo "$(tput bold)Account:        $(tput sgr0)" $(get_azure_account)
		echo "$(tput bold)Subscription:   $(tput sgr0)" $(get_azure_subscription)
		echo "$(tput bold)Resource Group: $(tput sgr0)" $(get_azure_resource_group)
		echo "$(tput bold)OS Image:       $(tput sgr0)" $image
		echo "$(tput bold)Disk Size:      $(tput sgr0)" $disk_size
		echo "$(tput bold)Machine Type:   $(tput sgr0)" $machine_type
		echo "$(tput bold)Name:           $(tput sgr0)" $name

		if ! confirm; then
			exit
		fi

		if [ ! -f ~/.ssh/audius-azure ]; then
			ssh-keygen -m PEM -t rsa -b 4096 -P "" -f ~/.ssh/audius-azure
		fi
		az vm create --name $name --image $image --os-disk-size-gb $disk_size --size $machine_type --public-ip-sku Basic --ssh-key-values ~/.ssh/audius-azure
		;;
	gcp)
		image_flags=$(gcp_image_to_flags $image)

		echo "$(tput bold)Provider:       $(tput sgr0)" $provider
		echo "$(tput bold)Account:        $(tput sgr0)" $(get_gcp_account)
		echo "$(tput bold)Project:        $(tput sgr0)" $(get_gcp_project)
		echo "$(tput bold)OS Image Flags: $(tput sgr0)" $image_flags
		echo "$(tput bold)Disk Size:      $(tput sgr0)" $disk_size
		echo "$(tput bold)Machine Type:   $(tput sgr0)" $machine_type
		echo "$(tput bold)Name:           $(tput sgr0)" $name

		if ! confirm; then
			exit
		fi

		gcloud compute instances create $name $image_flags --boot-disk-size $disk_size --machine-type $machine_type
		;;
	*)
		echoerr "Unknown Provider: $provider"
		exit 1
		;;
esac
