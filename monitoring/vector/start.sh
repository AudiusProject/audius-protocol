#!/bin/sh

if [ "${audius_logging_disabled}" = "true" ]; then
  echo "audius_logging_disabled is set to true"
  sleep infinity
fi

# set node to ${audius_discprov_url}, else ${creatorNodeEndpoint}
if [ "${audius_discprov_url}" ]; then
  node=${audius_discprov_url}
elif [ "${creatorNodeEndpoint}" ]; then
  node=${creatorNodeEndpoint}
# if neither node is not defined, set audius_delegate_owner_wallet as a proxy for node
elif [ "${audius_delegate_owner_wallet}" ]; then
  node=${audius_delegate_owner_wallet}
elif [ "${delegateOwnerWallet}" ]; then
  node=${delegateOwnerWallet}
elif [ "${DDEX_URL}" ]; then
  node=${DDEX_URL}
fi

# use regex to extract domain in url (source: https://stackoverflow.com/a/2506635/8674706)
if [ "${node}" ]; then
   node=$(echo ${node} | sed -e 's/[^/]*\/\/\([^@]*@\)\?\([^:/]*\).*/\2/')
fi

export node=${node}

# substitute env vars in vector.toml
envsubst < vector.toml > vector_tmp.toml
mv vector_tmp.toml vector.toml

# Launch vector
vector --config vector.toml

