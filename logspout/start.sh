#!/usr/bin/env sh

tag_csv=logspout
if [[ "${audius_loggly_tags}" ]]; then
   tag_csv=${tag_csv},${audius_loggly_tags}
fi

hostname=${audius_discprov_url}
if [[ -z "$hostname" ]]; then
   hostname=${creatorNodeEndpoint}
fi
if [[ "${hostname}" ]]; then
   hostname=$(echo ${hostname} | sed -e 's/[^/]*\/\/\([^@]*@\)\?\([^:/]*\).*/\2/')
   tag_csv=${tag_csv},${hostname}
fi

IFS=","
for tag in ${tag_csv}
do
   tags="${tags} tag=\"${tag}\""
done

export SYSLOG_STRUCTURED_DATA="$(echo ${audius_loggly_token} | base64 -d)@41058 ${tags}"
echo SYSLOG_STRUCTURED_DATA=${SYSLOG_STRUCTURED_DATA}

/bin/logspout multiline+syslog+tcp://logs-01.loggly.com:514
