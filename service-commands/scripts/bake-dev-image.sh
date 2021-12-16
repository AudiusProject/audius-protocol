#!/bin/bash
# bakes from latest master on gcp by default

set -x

# error handling
trap handle_provisioning_error 1
handle_provisioning_error () {
    "Error while provisioning - make sure cloud platform and service-commands A are set up. See service-commands README for details."
    exit 1
}

# Prerequisites:
    # service-commands installed w A alias
    # GCP access (if baking w GCP)
    # Azure access (if baking w Azure)
# Default values of arguments
USE_AZURE=0 # GCP by default
SOURCE_DISK="christine-new-bake" # name of remote box to bake as AMI
PROTOCOL_GIT_REF="master"
CLIENT_GIT_REF="master"
USERNAME="ubuntu"
d=`date +%m-%d-%Y`
echo $d
BUILD_INSTANCE_NAME="audius-bake-dev-$d"

process_arguments () {
    for arg in "$@"
    do
        case $arg in
            -a|--azure)
            USE_AZURE=1
            shift # Remove --azure from processing
            ;;
            -s|--source)
            SOURCE_DISK="$2"
            shift # Remove --source= from processing
            shift
            ;;
            -p|--protocol)
            PROTOCOL_GIT_REF="$2"
            shift # Remove argument name from processing
            shift # Remove argument value from processing
            ;;
            -c|--client)
            CLIENT_GIT_REF="$2"
            shift # Remove argument name from processing
            shift # Remove argument value from processing
            ;;
        esac
    done
    echo "# Use Azure instead of GCP: $USE_AZURE"
    echo "# Source disk: $SOURCE_DISK"
    echo "# Protocol git ref to build at: $PROTOCOL_GIT_REF"
    echo "# Client git ref to build at: $CLIENT_GIT_REF"
}

create_image_with_gcp() {
    local GOOGLE_PROJECT_NAME="audius-infrastructure"
    local DEFAULT_GCP_REGION="us-central1-a"
    local SOURCE_DISK="$1"
    local PROTOCOL_GIT_HASH="$2"
    local CLIENT_GIT_HASH="$3"
    local IMAGE_NAME="$1-bake-$d"
    gcloud compute images create \
        "$IMAGE_NAME" \
        --project="$GOOGLE_PROJECT_NAME" \
        --source-disk="$SOURCE_DISK" \
        --source-disk-zone="$DEFAULT_GCP_REGION" \
        --labels=protocol-git-hash="$PROTOCOL_GIT_HASH",client-git-hash="$CLIENT_GIT_HASH" \
        --storage-location=us
}

provision_dev_with_gcp() {
    local BAKE_MACHINE_NAME=$1
    local PROTOCOL_GIT_REF=$2
    local CLIENT_GIT_REF=$3
    A setup remote-dev \
        "$BAKE_MACHINE_NAME" \
        --protocol-git-ref "$PROTOCOL_GIT_REF" \
        --client-git-ref "$CLIENT_GIT_REF"
}

prepare_gcp_instance_for_image_creation() {
    local BAKE_MACHINE_NAME=$1
    local IP=$(gcloud compute instances describe "$BAKE_MACHINE_NAME" --format "get(networkInterfaces[0].accessConfigs[0].natIP)")
    ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null "ubuntu@$IP" -t "sudo sync" # get ready for baking - TODO change to shutdown script https://cloud.google.com/compute/docs/shutdownscript
    gcloud compute instances stop "$BAKE_MACHINE_NAME"
}

bake_with_gcp () {
    local BUILD_INSTANCE_NAME=$1
    local PROTOCOL_GIT_REF=$2
    local CLIENT_GIT_REF=$3
    local SOURCE_DISK=$4
    if [ -z $SOURCE_DISK ]; then
        provision_dev_with_gcp "$BUILD_INSTANCE_NAME" "$PROTOCOL_GIT_REF" "$CLIENT_GIT_REF"
        SOURCE_DISK="$BUILD_INSTANCE_NAME"
    fi
    # prepare_gcp_instance_for_image_creation "$SOURCE_DISK"
    create_image_with_gcp "$SOURCE_DISK" "$PROTOCOL_GIT_REF" "$CLIENT_GIT_REF"
}

bake_dev_image () {
    process_arguments "$@"
    if [ "$USE_AZURE" -eq "0" ]; then
        bake_with_gcp "$BUILD_INSTANCE_NAME" "$PROTOCOL_GIT_REF" "$CLIENT_GIT_REF" "$SOURCE_DISK"
    fi
}

bake_dev_image "$@"
