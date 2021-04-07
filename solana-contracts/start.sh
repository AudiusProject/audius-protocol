address=BCd61FAc303e9fc78fDf612A71AAa7a47a36b2d6
priv_key=c8fa5fdef48a400fc1005d9e939d5b7b99b29bddd56bbd4272c40d5e38e7ca0a

solana-keygen new -s --no-bip39-passphrase

solana config set -u devnet

solana airdrop 5
solana airdrop 5 feepayer.json
solana airdrop 5 owner.json

cd create_and_verify
solana-keygen new -s --no-bip39-passphrase -o target/deploy/solana_program_template-keypair.json --force
cur_address=$(grep -Po '(?<=declare_id!\(").*(?=")' src/lib.rs)
new_address=$(solana program deploy target/deploy/solana_program_template.so --output json | jq -r '.programId')
sed -i "s/$cur_address/$new_address/g" src/lib.rs

cd ../program
solana-keygen new -s --no-bip39-passphrase -o target/deploy/audius-keypair.json --force
cur_address=$(grep -Po '(?<=declare_id!\(").*(?=")' src/lib.rs)
new_address=$(solana program deploy target/deploy/audius.so --output json | jq -r '.programId')
sed -i "s/$cur_address/$new_address/g" src/lib.rs

cd ../cli
signer_group=$(cargo run create-signer-group | grep -Po '(?<=account ).*')
valid_signer=$(cargo run create-valid-signer "$signer_group" "$address" | grep -Po '(?<=account ).*')

cd ..
cat > solana-contract-config.json <<EOF
{
    "createAndVerifyAddress": "$(grep -Po '(?<=declare_id!\(").*(?=")' create_and_verify/src/lib.rs)",
    "programAddress": "$(grep -Po '(?<=declare_id!\(").*(?=")' program/src/lib.rs)",
    "validSigner": "$valid_signer"
}
EOF
