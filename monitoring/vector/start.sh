#!/bin/sh

# set node to ${audius_discprov_url}, else ${creatorNodeEndpoint}
if [[ "${audius_discprov_url}" ]]; then
  node=${audius_discprov_url}
elif [[ "${creatorNodeEndpoint}" ]]; then
  node=${creatorNodeEndpoint}
# if neither node is not defined, set audius_delegate_owner_wallet as a proxy for node
elif [[ "${audius_delegate_owner_wallet}" ]]; then
  node=${audius_delegate_owner_wallet}
elif [[ "${delegateOwnerWallet}"]]; then
  node=${delegateOwnerWallet}
fi

# use regex to extract domain in url (source: https://stackoverflow.com/a/2506635/8674706)
if [[ "${node}" ]]; then
   node=$(echo ${node} | sed -e 's/[^/]*\/\/\([^@]*@\)\?\([^:/]*\).*/\2/')
fi

# Generate a vector.toml
cat <<-EOF > $PWD/vector.toml
[api]
  enabled = true
  address = "0.0.0.0:8686"

[sources.logs]
  type = "docker_logs"
  docker_host = "/var/run/docker.sock"
  include_containers = [ "audius/" ]
  exclude_containers = [ "comms", "exporter" ]

[transforms.modify]
  type = "remap"
  inputs = ["logs"]
  source = '''
    .node = "${node}"
  '''

[sinks.out]
  inputs = [ "modify" ]
  type = "console"
  encoding.codec = "json"

EOF

# Launch vector
vector --config $PWD/vector.toml

# [sinks.axiom]
# type = "axiom"
# inputs = [ "docker" ]
# token = $audius_axiom_token
# dataset = $audius_axiom_dataset
# url = "https://cloud.axiom.co"
# org_id = "audius-Lu52"

