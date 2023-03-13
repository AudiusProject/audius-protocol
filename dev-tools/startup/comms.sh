#!/usr/bin/env sh

export AUDIUS_REBALANCE_INTERVAL_HOURS="0.005" # check for unhealthy nodes and update healthy node set every 18 seconds
export AUDIUS_HEALTH_TTL_HOURS="0.005"         # consider a node unhealthy if it hasn't self-reported "OK" status in the last 18 seconds
export AUDIUS_REPORT_OK_INTERVAL_SECONDS=4
export AUDIUS_SHARD_LENGTH=1
export AUDIUS_NATS_ENABLE_JETSTREAM=true

export NAME="$(nslookup "$(hostname -i)" | sed -n 's/.*name = \(.*\)/\1/p')"
export AUDIUS_TEST_HOST="$NAME"

# Treat test container same as storage-1
if [[ "$NAME" =~ ".*-test-.*" ]]; then
  export NAME="$(echo "$NAME" | sed 's/-test-/-storage-/')"
  export AUDIUS_TEST_HOST="$NAME"
fi

# Set nats server url for non nats containers
if [[ ! "$NAME" =~ ".*-nats-.*" ]]; then
  export NATS_SERVER_URL="nats://$(echo "$NAME" | sed 's/\(discovery\|storage\)/nats-\1/'):4222"
fi

if [[ "$NAME" =~ ".*-discovery-.*" ]]; then
  replica=$(echo "$NAME" | grep -o "[0-9]\+")
  export AUDIUS_DELEGATE_PRIVATE_KEY="$(printenv "COMMS_DISCOVERY_DELEGATE_${replica}_PRIVATE_KEY")"
fi

if [[ "$NAME" =~ ".*-storage-.*" ]]; then
  replica=$(echo "$NAME" | grep -o "[0-9]\+")
  export AUDIUS_DELEGATE_PRIVATE_KEY="$(printenv "COMMS_STORAGE_DELEGATE_${replica}_PRIVATE_KEY")"
fi

export AUDIUS_DEV_ONLY_REGISTERED_NODES="[
  {
    \"id\": \"content-node::1\",
    \"spId\": \"1\",
    \"endpoint\": \"http://comms-storage-ingress-1\",
    \"delegateOwnerWallet\": \"$COMMS_STORAGE_DELEGATE_1_ADDRESS\",
    \"owner\": { \"id\": \"0x339511506f7BfB5f5d7042b450B9D450626dbB91\" },
    \"type\": { \"id\": \"content-node\" }
  },
  {
    \"id\": \"content-node::2\",
    \"spId\": \"2\",
    \"endpoint\": \"http://comms-storage-ingress-2\",
    \"delegateOwnerWallet\": \"$COMMS_STORAGE_DELEGATE_2_ADDRESS\",
    \"owner\": { \"id\": \"0x11327A21bc4dE71a1274D7C1e2c94D50AdeeBB88\" },
    \"type\": { \"id\": \"content-node\" }
  },
  {
    \"id\": \"content-node::3\",
    \"spId\": \"3\",
    \"endpoint\": \"http://comms-storage-ingress-3\",
    \"delegateOwnerWallet\": \"$COMMS_STORAGE_DELEGATE_3_ADDRESS\",
    \"owner\": { \"id\": \"0x339511506f7BfB5f5d7042b450B9D450626dbB91\" },
    \"type\": { \"id\": \"content-node\" }
  },
  {
    \"id\": \"content-node::4\",
    \"spId\": \"4\",
    \"endpoint\": \"http://comms-storage-ingress-4\",
    \"delegateOwnerWallet\": \"$COMMS_STORAGE_DELEGATE_4_ADDRESS\",
    \"owner\": { \"id\": \"0x11327A21bc4dE71a1274D7C1e2c94D50AdeeBB88\" },
    \"type\": { \"id\": \"content-node\" }
  },
  {
    \"id\": \"discovery-node::1\",
    \"spId\": \"5\",
    \"endpoint\": \"http://comms-discovery-ingress-1\",
    \"delegateOwnerWallet\": \"$COMMS_DISCOVERY_DELEGATE_1_ADDRESS\",
    \"owner\": { \"id\": \"0x339511506f7BfB5f5d7042b450B9D450626dbB91\" },
    \"type\": { \"id\": \"discovery-node\" }
  },
  {
    \"id\": \"discovery-node::2\",
    \"spId\": \"6\",
    \"endpoint\": \"http://comms-discovery-ingress-2\",
    \"delegateOwnerWallet\": \"$COMMS_DISCOVERY_DELEGATE_2_ADDRESS\",
    \"owner\": { \"id\": \"0x11327A21bc4dE71a1274D7C1e2c94D50AdeeBB88\" },
    \"type\": { \"id\": \"discovery-node\" }
  },
  {
    \"id\": \"discovery-node::3\",
    \"spId\": \"7\",
    \"endpoint\": \"http://comms-discovery-ingress-3\",
    \"delegateOwnerWallet\": \"$COMMS_DISCOVERY_DELEGATE_3_ADDRESS\",
    \"owner\": { \"id\": \"0x339511506f7BfB5f5d7042b450B9D450626dbB91\" },
    \"type\": { \"id\": \"discovery-node\" }
  }
]"
