#!/usr/bin/env sh

export audius_enable_rsyslog=false

export audius_discprov_url="http://$(hostname -i):5000"

export audius_delegate_owner_wallet=$(printenv "DP${replica}_DELEGATE_OWNER_ADDRESS")
export audius_delegate_private_key=$(printenv "DP${replica}_DELEGATE_OWNER_PRIVATE_KEY")

elasticsearch_host=$(nslookup $(hostname -i) | grep -o "name = .*" | grep -o "[^ ]\+$" | sed 's/discovery-provider/discovery-provider-elasticsearch/')
if nslookup "$elasticsearch_host" >/dev/null 2>&1; then
    export audius_elasticsearch_url="http://$elasticsearch_host:9200"
    export audius_elasticsearch_run_indexer="true"
fi

# Run register script in background as it waits for the node to be healthy
./scripts/register.py &
