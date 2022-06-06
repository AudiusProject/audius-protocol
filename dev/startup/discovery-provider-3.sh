#!/usr/bin/env sh

export audius_discprov_url="http://$(hostname -i):5000"

export audius_delegate_owner_wallet="0x982a8CbE734cb8c29A6a7E02a3B0e4512148F6F9"
export audius_delegate_private_key="0xd353907ab062133759f149a3afcb951f0f746a65a60f351ba05a3ebf26b67f5c"

# Run register script in background as it waits for the node to be healthy
./scripts/register.py &
