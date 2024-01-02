#!/usr/bin/env sh

if [[ "$audius_db_url" == "" ]]; then
    export audius_db_url="postgresql+psycopg2://postgres:postgres@db:5432/discovery_provider_${replica}"
    export audius_db_url_read_replica="postgresql+psycopg2://postgres:postgres@db:5432/discovery_provider_${replica}"
fi

if [[ "$audius_redis_url" == "" ]]; then
    export audius_redis_url="redis://audius-protocol-discovery-provider-redis-${replica}:6379/00"
fi

export audius_enable_rsyslog=false

export audius_discprov_url="http://audius-protocol-discovery-provider-${replica}"

export audius_delegate_owner_wallet=$(printenv "DP${replica}_DELEGATE_OWNER_ADDRESS")
export audius_delegate_private_key=$(printenv "DP${replica}_DELEGATE_OWNER_PRIVATE_KEY")

elasticsearch_host=$(nslookup $(hostname -i) | grep -o "name = .*" | grep -o "[^ ]\+$" | sed 's/discovery-provider/discovery-provider-elasticsearch/')
if nslookup "$elasticsearch_host" >/dev/null 2>&1; then
    export audius_elasticsearch_url="http://$elasticsearch_host:9200"
fi

# Run register script in background
./scripts/register.py &

# Create sender for current DN
../../node_modules/.bin/ts-node ./scripts/createSender.ts ${replica} &