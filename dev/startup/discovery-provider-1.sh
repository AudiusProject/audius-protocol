#!/usr/bin/env sh

export audius_discprov_url="http://$(hostname -i):5000"

export audius_delegate_owner_wallet="0x73EB6d82CFB20bA669e9c178b718d770C49BB52f"
export audius_delegate_private_key="0xd09ba371c359f10f22ccda12fd26c598c7921bda3220c9942174562bc6a36fe8"

./scripts/register.py
