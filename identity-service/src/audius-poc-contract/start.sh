address=BCd61FAc303e9fc78fDf612A71AAa7a47a36b2d6
priv_key=c8fa5fdef48a400fc1005d9e939d5b7b99b29bddd56bbd4272c40d5e38e7ca0a

solana-keygen new -s --no-bip39-passphrase

solana config set -u devnet

solana airdrop 5
solana airdrop 5 feepayer.json
solana airdrop 5 owner.json

cd create_and_verify
cur_address=$(grep -Po '(?<=declare_id!\(").*(?=")' src/lib.rs)
new_address=$(solana program deploy target/deploy/solana_program_template.so --output json | jq -r '.programId')
sed -i "s/$cur_address/$new_address/g" src/lib.rs ../js_client/index.js

cd ../program
cur_address=$(grep -Po '(?<=declare_id!\(").*(?=")' src/lib.rs)
new_address=$(solana program deploy target/deploy/audius.so --output json | jq -r '.programId')
sed -i "s/$cur_address/$new_address/g" src/lib.rs ../js_client/index.js

cd ../cli
signer_group=$(cargo run create-signer-group | grep -Po '(?<=account ).*')
valid_signer=$(cargo run create-valid-signer "$signer_group" "$address" | grep -Po '(?<=account ).*')
old_valid_signer=$(grep -Po "(?<=VALID_SIGNER = ').*(?=')" ../js_client/index.js)
sed -i "s/$old_valid_signer/$valid_signer/g" ../js_client/index.js

python -m http.server 8080
