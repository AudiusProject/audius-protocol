#!/usr/bin/env bash
set -euo pipefail


protocol_dir="$(readlink -f "${BASH_SOURCE[0]}" | sed -nr 's/(.*)\/solana-programs\/anchor.*/\1/p')"
TX_PARSER_DIR="$protocol_dir/packages/discovery-provider/solana-tx-parser"

AUDIUS_DATA_PROGRAM_ID=$(solana-keygen pubkey $PWD/target/deploy/audius_data-keypair.json)

echo "Installing parser deps if needed..."
cd "$TX_PARSER_DIR" && python3.9 -m pip install -r requirements.txt

echo "Running parser with tx hash "$@"... If no tx hash is provided, parser will default to all tx for program ID $AUDIUS_DATA_PROGRAM_ID"
TX_HASH="$@" python3.9 tx_parser.py
