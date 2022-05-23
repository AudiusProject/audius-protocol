#!/usr/bin/env sh

audius_loggly_tags=${audius_loggly_tags},logspout

IFS=","
for tag in ${audius_loggly_tags}
do
   tags="${tags} tag=\"${tag}\""
done

export SYSLOG_STRUCTURED_DATA="$(echo ${audius_loggly_token} | base64 -d)@41058 ${tags}"
echo SYSLOG_STRUCTURED_DATA=${SYSLOG_STRUCTURED_DATA}

/bin/logspout multiline+syslog+tcp://logs-01.loggly.com:514
