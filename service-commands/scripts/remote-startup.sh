#! /bin/bash
set -x
sudo -u ubuntu bash -c 'cd ~/; pwd; source ~/.profile; source ~/.bashrc; .local/bin/A up'
OWN_NAME=$(curl -sfL -H "Metadata-Flavor: Google" http://metadata/computeMetadata/v1/instance/name)
OWN_ZONE=$(curl -sfL -H "Metadata-Flavor: Google" http://metadata/computeMetadata/v1/instance/zone)
gcloud compute instances add-metadata "$OWN_NAME" --metadata=pizza=done --zone="$OWN_ZONE"
