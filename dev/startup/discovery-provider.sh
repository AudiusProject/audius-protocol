#!/usr/bin/env sh

export audius_discprov_url="http://$(hostname -i):5000"

export audius_delegate_owner_wallet=$(printenv "DP${replica}_DELEGATE_OWNER_ADDRESS")
export audius_delegate_private_key=$(printenv "DP${replica}_DELEGATE_OWNER_PRIVATE_KEY")

# Run register script in background as it waits for the node to be healthy
./scripts/register.py &
