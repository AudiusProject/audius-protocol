#!/usr/bin/env sh

# set hostname to ${audius_discprov_url}, else ${creatorNodeEndpoint}
if [[ "${audius_discprov_url}" ]]; then
  hostname=${audius_discprov_url}
elif [[ "${creatorNodeEndpoint}" ]]; then
  hostname=${creatorNodeEndpoint}
# if neither hostname is not defined, set audius_delegate_owner_wallet as a proxy for hostname
elif [[ "${audius_delegate_owner_wallet}" ]]; then
  hostname=${audius_delegate_owner_wallet}
elif [[ "${delegateOwnerWallet}"]]; then
  hostname=${delegateOwnerWallet}
fi

# use regex to extract domain in url (source: https://stackoverflow.com/a/2506635/8674706)
if [[ "${hostname}" ]]; then
   hostname=$(echo ${hostname} | sed -e 's/[^/]*\/\/\([^@]*@\)\?\([^:/]*\).*/\2/')
fi

tags=${hostname}

# Generate a vector.toml
cat <<-EOF > $PWD/vector.toml
[api]
enabled = true
address = "0.0.0.0:8686"

[sources.docker]
type = "docker_logs"
docker_host = "/var/run/docker.sock"
include_containers = [ "audius/" ]
exclude_containers = [ "audius/comms" ]

[sinks.axiom]
type = "axiom"
inputs = [ "docker" ]
token = $audius_axiom_token
dataset = $audius_axiom_dataset
url = "https://cloud.axiom.co"
org_id = "audius-Lu52"

[sinks.out]
inputs = [ "docker" ]
type = "console"
encoding.codec = "json"
EOF

# Launch vector
vector --config $PWD/vector.toml