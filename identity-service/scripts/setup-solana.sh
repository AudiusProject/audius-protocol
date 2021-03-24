#!/bin/sh

address=BCd61FAc303e9fc78fDf612A71AAa7a47a36b2d6
priv_key=c8fa5fdef48a400fc1005d9e939d5b7b99b29bddd56bbd4272c40d5e38e7ca0a

curr_dir=$(dirname "$(readlink -f "$0")")

sudo apt-get update && sudo apt-get install jq                  # install jq
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh  # install rustup
sh -c "$(curl -sSfL https://release.solana.com/v1.6.1/install)" # install solana

solana-keygen new

solana-test-validator &

solana airdop --faucet-host 127.0.0.1 1000
solana airdop --faucet-host 127.0.0.1 1000 "$curr_dir/feepayer.json"
solana airdop --faucet-host 127.0.0.1 1000 "$curr_dir/owner.json"

cd "$curr_dir/../src/audius-poc-contract/create_and_verify"
cargo build-bpf
cur_address=$(grep -Po '(?<=declare_id!\(").*(?=")' src/lib.rs)
new_address=$(solana program deploy target/deploy/solana_program_template.so | jq -r '.programId')
sed -i "s/$cur_address/$new_address/g" src/lib.rs ../js_client/audius_instructions.js ../python_listener/client.py

cd "$curr_dir/../src/audius-poc-contract/program"
cargo build-bpf
cur_address=$(grep -Po '(?<=declare_id!\(").*(?=")' src/lib.rs)
new_address=$(solana program deploy target/deploy/audius.so | jq -r '.programId')
sed -i "s/$cur_address/$new_address/g" src/lib.rs ../js_client/audius_instructions.js ../python_listener/client.py

cd "$curr_dir/../src/audius-poc-contract/cli"
signer_group=$(cargo run create-signer-group | grep -Po '(?<=account ).*')
valid_signer=$(cargo run create-valid-signer "$signer_group" "$address" | grep -Po '(?<=account ).*')
old_valid_signer=$(grep -Po '(?<=VALID_SIGNER = ").*(?=")' ../js_client/audius_instructions.js)
sed -i "s/$old_valid_signer/$valid_signer/g" ../js_client/audius_instructions.js
