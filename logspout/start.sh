#!/usr/bin/env sh

# start with `logspout` Loggly tag, and add ${audius_loggly_tags} or ${logglyTags} if present
tag_csv=logspout
if [[ "${audius_loggly_tags}" ]]; then
   tag_csv=${tag_csv},${audius_loggly_tags}
elif [[ "${logglyTags}" ]]; then
   tag_csv=${tag_csv},${logglyTags}
fi

# set hostname to ${audius_discprov_url}, else ${creatorNodeEndpoint}
if [[ "${audius_discprov_url}" ]]; then
   hostname=${audius_discprov_url}
elif [[ "${creatorNodeEndpoint}" ]]; then
   hostname=${creatorNodeEndpoint}
# if neither hostname is not defined, set audius_delegate_owner_wallet as a proxy for hostname
elif [[ "${audius_delegate_owner_wallet}" ]]; then
   hostname=DelegateOwnerWallet-${audius_delegate_owner_wallet}
fi

# use regex to extract domain in url (source: https://stackoverflow.com/a/2506635/8674706)
# add extracted domain as a Loggly tag
if [[ "${hostname}" ]]; then
   hostname=$(echo ${hostname} | sed -e 's/[^/]*\/\/\([^@]*@\)\?\([^:/]*\).*/\2/')
   tag_csv=${tag_csv},${hostname}
fi

# reformat our comma-delimited list
IFS=","
for tag in ${tag_csv}
do
   tags="${tags} tag=\"${tag}\""
done

# set and echo our Loggly token and tags for Logspout
export SYSLOG_STRUCTURED_DATA="$(echo ${audius_loggly_token} | base64 -d)@41058 ${tags}"
echo SYSLOG_STRUCTURED_DATA=${SYSLOG_STRUCTURED_DATA}

# start logspout if audius_loggly_disable is not set
if [[ -z "$audius_loggly_disable" ]]; then
   /bin/logspout multiline+syslog+tcp://logs-01.loggly.com:514
fi