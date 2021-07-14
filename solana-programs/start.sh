{
    eth_account=$(python -c "from web3.auto import w3; a = w3.eth.account.create(); print(a.address[2:], a.privateKey.hex()[2:])")
    address=$(echo $eth_account | cut -d' ' -f1)
    priv_key=$(echo $eth_account | cut -d' ' -f2)

    solana config set -u $SOLANA_HOST

    solana-keygen new -s --no-bip39-passphrase
    solana-keygen new -s --no-bip39-passphrase -o feepayer.json
    feepayer_pubkey=$(solana-keygen pubkey feepayer.json)

    while test $(solana balance feepayer.json | sed 's/\(\.\| \).*//') -lt 10; do
        solana airdrop 1 feepayer.json # adjust this number if running against a different endpoint
    done

    while test $(solana balance | sed 's/\(\.\| \).*//') -lt 10; do
        solana airdrop 1
    done

    cd audius_eth_registry
    cargo build-bpf
    solana-keygen new -s --no-bip39-passphrase -o target/deploy/audius_eth_registry-keypair.json --force
    cur_address=$(grep -Po '(?<=declare_id!\(").*(?=")' src/lib.rs)
    audius_eth_registry_address=$(solana program deploy target/deploy/audius_eth_registry.so --output json | jq -r '.programId')
    if [ -z "$audius_eth_registry_address" ]; then
        echo "failed to deploy audius_eth_registry"
        exit 1
    fi
    sed -i "s/$cur_address/$audius_eth_registry_address/g" src/lib.rs

    while test $(solana balance | sed 's/\(\.\| \).*//') -lt 10; do
        solana airdrop 1
    done

    cd ../track_listen_count
    cargo build-bpf
    solana-keygen new -s --no-bip39-passphrase -o target/deploy/track_listen_count-keypair.json --force
    cur_address=$(grep -Po '(?<=declare_id!\(").*(?=")' src/lib.rs)
    track_listen_count_address=$(solana program deploy target/deploy/track_listen_count.so --output json | jq -r '.programId')
    if [ -z "$track_listen_count_address" ]; then
        echo "failed to deploy track_listen_count"
        exit 1
    fi
    sed -i "s/$cur_address/$track_listen_count_address/g" src/lib.rs

    cd ../cli
    # Initialize track listen count entities
    signer_group=$(cargo run create-signer-group | grep -Po '(?<=account ).*')
    valid_signer=$(cargo run create-valid-signer "$signer_group" "$address" | grep -Po '(?<=account ).*')
    owner_wallet=$(cat ~/.config/solana/id.json)

    # Deploy wAUDIO token
    token=$(spl-token create-token | cat | head -n 1 | cut -d' ' -f3)
    token_account=$(spl-token create-account $token | cat | head -n 1 | cut -d' ' -f3)
    spl-token mint $token 100

    echo "Creating UserBank accounts..."
    cd ../claimable-tokens/program
    cargo build-bpf
    claimable_token_address=$(solana program deploy target/deploy/claimable_tokens.so --output json | jq -r '.programId')
    if [ -z "$claimable_token_address" ]; then
        echo "failed to deploy UserBank"
        exit 1
    fi

} >&2

# Back up 2 directories to audius-protocol/solana-programs
cd ../../

cat <<EOF
{
    "trackListenCountAddress": "$track_listen_count_address",
    "audiusEthRegistryAddress": "$audius_eth_registry_address",
    "validSigner": "$valid_signer",
    "signerGroup": "$signer_group",
    "feePayerWallet": $(cat feepayer.json),
    "feePayerWalletPubkey": "$feepayer_pubkey",
    "ownerWallet": "$owner_wallet",
    "endpoint": "$SOLANA_HOST",
    "signerPrivateKey": "$priv_key",
    "splToken": "$token",
    "splTokenAccount": "$token_account",
    "claimableTokenAddress": "$claimable_token_address"
}
EOF
