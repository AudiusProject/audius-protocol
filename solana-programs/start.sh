{
    eth_account=$(python -c "from web3.auto import w3; a = w3.eth.account.create(); print(a.address[2:], a.privateKey.hex()[2:])")
    address=$(echo $eth_account | cut -d' ' -f1)
    priv_key=$(echo $eth_account | cut -d' ' -f2)

    solana config set -u http://34.122.200.71:8899

    solana-keygen new -s --no-bip39-passphrase
    solana-keygen new -s --no-bip39-passphrase -o feepayer.json

    while test $(solana balance feepayer.json | sed 's/\(\.\| \).*//') -lt 1; do
        solana airdrop 0.5 feepayer.json
    done

    while test $(solana balance | sed 's/\(\.\| \).*//') -lt 3; do
        solana airdrop 0.5
    done

    cd program
    cargo build-bpf
    solana-keygen new -s --no-bip39-passphrase -o target/deploy/audius-keypair.json --force
    cur_address=$(grep -Po '(?<=declare_id!\(").*(?=")' src/lib.rs)
    new_address=$(solana program deploy target/deploy/audius.so --output json | jq -r '.programId')
    if [ -z "$new_address" ]; then
        echo "failed to deploy program"
        exit 1
    fi
    sed -i "s/$cur_address/$new_address/g" src/lib.rs

    while test $(solana balance | sed 's/\(\.\| \).*//') -lt 3; do
        solana airdrop 0.5
    done

    cd ../track_listen_count
    cargo build-bpf
    solana-keygen new -s --no-bip39-passphrase -o target/deploy/track_listen_count-keypair.json --force
    cur_address=$(grep -Po '(?<=declare_id!\(").*(?=")' src/lib.rs)
    new_address=$(solana program deploy target/deploy/track_listen_count.so --output json | jq -r '.programId')
    if [ -z "$new_address" ]; then
        echo "failed to deploy track_listen_count"
        exit 1
    fi
    sed -i "s/$cur_address/$new_address/g" src/lib.rs

    cd ../cli
    signer_group=$(cargo run create-signer-group | grep -Po '(?<=account ).*')
    valid_signer=$(cargo run create-valid-signer "$signer_group" "$address" | grep -Po '(?<=account ).*')
    owner_wallet=$(cat ~/.config/solana/id.json)
} >&2

cd ..

cat <<EOF
{
    "trackListenCountAddress": "$(grep -Po '(?<=declare_id!\(").*(?=")' track_listen_count/src/lib.rs)",
    "audiusEthRegistryAddress": "$(grep -Po '(?<=declare_id!\(").*(?=")' program/src/lib.rs)",
    "validSigner": "$valid_signer",
    "signerGroup": "$signer_group",
    "feePayerWallet": $(cat feepayer.json),
    "ownerWallet": "$owner_wallet",
    "endpoint": "http://34.122.200.71:8899",
    "signerPrivateKey": "$priv_key"
}
EOF
