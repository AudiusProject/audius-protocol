#!/bin/sh

default_timeout=${default_timeout:-43200s} # 12 hours
sleep $default_timeout
export NAME=$(curl -X GET http://metadata.google.internal/computeMetadata/v1/instance/name -H 'Metadata-Flavor: Google')
export ZONE=$(curl -X GET http://metadata.google.internal/computeMetadata/v1/instance/zone -H 'Metadata-Flavor: Google')
gcloud --quiet compute firewall-rules delete $NAME --zone=$ZONE
gcloud --quiet compute instances delete $NAME --zone=$ZONE
