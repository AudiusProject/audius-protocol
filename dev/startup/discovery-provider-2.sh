#!/usr/bin/env sh

export audius_discprov_url="http://$(hostname -i):5000"

export audius_delegate_owner_wallet="0x9D8E5fAc117b15DaCED7C326Ae009dFE857621f1"
export audius_delegate_private_key="0x2d2719c6a828911ed0c50d5a6c637b63353e77cf57ea80b8e90e630c4687e9c5"

./scripts/register.py
