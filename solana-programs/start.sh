{
    solana -V

    eth_account=$(python -c "from web3.auto import w3; a = w3.eth.account.create(); print(a.address[2:], a.privateKey.hex()[2:])")
    address=$(echo $eth_account | cut -d' ' -f1)
    priv_key=$(echo $eth_account | cut -d' ' -f2)
    owner_wallet_path=~/.config/solana/id.json

    solana config set -u $SOLANA_HOST

    solana-keygen new -s --no-bip39-passphrase -o $owner_wallet_path --force
    solana-keygen new -s --no-bip39-passphrase -o feepayer.json --force
    feepayer_pubkey=$(solana-keygen pubkey feepayer.json)

    while test $(solana balance feepayer.json | sed 's/\(\.\| \).*//') -lt 10; do
        solana airdrop 100 feepayer.json # adjust this number if running against a different endpoint
    done

    while test $(solana balance | sed 's/\(\.\| \).*//') -lt 10; do
        solana airdrop 100
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
    cargo build
    # Initialize track listen count entities
    signer_group=$(cargo run create-signer-group | grep -Po '(?<=account ).*')
    valid_signer=$(cargo run create-valid-signer "$signer_group" "$address" | grep -Po '(?<=account ).*')

    # Export owner wallet information
    owner_wallet=$(cat $owner_wallet_path)
    owner_wallet_pubkey=$(solana-keygen pubkey)

    # Deploy wAUDIO token
    token=$(spl-token create-token --decimals 8 | cat | head -n 1 | cut -d' ' -f3)
    token_account=$(spl-token create-account $token | cat | head -n 1 | cut -d' ' -f3)

    # Mint 100,000,000 Tokens
    spl-token mint $token 100000000

    echo "Creating UserBank accounts..."
    cd ../claimable-tokens/program
    cargo build-bpf
    solana-keygen new -s --no-bip39-passphrase -o target/deploy/claimable_tokens-keypair.json --force
    cur_address=$(grep -Po '(?<=declare_id!\(").*(?=")' src/lib.rs)
    claimable_token_address=$(solana program deploy target/deploy/claimable_tokens.so --output json | jq -r '.programId')
    if [ -z "$claimable_token_address" ]; then
        echo "failed to deploy UserBank"
        exit 1
    fi
    sed -i "s/$cur_address/$claimable_token_address/g" src/lib.rs

    cd ../cli
    cargo build
    generate_pda_output=$(cargo run generate-base-pda "$token" "$claimable_token_address")
    echo $generate_pda_output

    echo "Building RewardsManager"
    cd ../../reward-manager/
    cur_address=$(grep -Po '(?<=declare_id!\(").*(?=")' program/src/lib.rs)
    cargo build-bpf

    echo "Copying claimable-tokens.so for tests"
    cp ../claimable-tokens/program/target/deploy/claimable_tokens.so program/

    echo "Deploying RewardsManager..."
    solana-keygen new -s --no-bip39-passphrase -o target/deploy/audius_reward_manager-keypair.json --force
    rewards_manager_address=$(solana program deploy target/deploy/audius_reward_manager.so --output json | jq -r '.programId')
    echo $rewards_manager_address
    if [ -z "$rewards_manager_address" ]; then
        echo "failed to deploy RewardsManager"
        exit 1
    fi
    sed -i "s/$cur_address/$rewards_manager_address/g" program/src/lib.rs

    cd ../reward-manager/cli
    cargo build

    echo "Initializing RewardsManager | Mint = $token"
    init_reward_output=$(cargo run init --min-votes 2 --token-mint "$token")
    reward_manager_account_key="$(echo $init_reward_output | awk '{print $5}')"
    reward_manager_token_account_key="$(echo $init_reward_output | awk '{print $11}')"
    echo "Reward manager account key: $reward_manager_account_key"
    echo "Reward manager token acct key: $reward_manager_token_account_key"
    echo "Transferring funds to RewardsManager funds holder..."
    spl-token transfer $token 100000000 $reward_manager_token_account_key

    echo "Testing create sender"
    cargo run create-sender --eth-operator-address 0xF24936714293a0FaF39A022138aF58D874289132  --eth-sender-address 0xF24936714293a0FaF39A022138aF58D874289133 --reward-manager $reward_manager_account_key

    # Build anchor program
    echo "--- Anchor build ---- "
    cd ../../anchor/audius-data
    yarn install

    # Replace program ID with solana pubkey generated from anchor build
    cur_address=$(grep -Po '(?<=declare_id!\(").*(?=")' programs/audius-data/src/lib.rs)

    solana-keygen new -s --no-bip39-passphrase -o target/deploy/audius_data-keypair.json --force
    anchor_program_id=$(solana-keygen pubkey target/deploy/audius_data-keypair.json)
    echo "New address for audius-data: $anchor_program_id"

    sed -i "s/$cur_address/$(solana-keygen pubkey target/deploy/audius_data-keypair.json)/g" Anchor.toml
    sed -i "s/$cur_address/$(solana-keygen pubkey target/deploy/audius_data-keypair.json)/g" programs/audius-data/src/lib.rs

    # Build AFTER updated program ID
    anchor build

    anchor_program_id=$(solana-keygen pubkey target/deploy/audius_data-keypair.json)

    echo "--- Anchor deploy ---- "
    # Deploy anchor program
    anchor deploy --provider.cluster $SOLANA_HOST

    # Initialize Audius Admin account
    yarn run ts-node cli/main.ts --function initAdmin --owner-keypair $owner_wallet_path --network $SOLANA_HOST

    # Propagate local variables
    admin_authority_keypair_path="$PWD/adminAuthorityKeypair.json"
    admin_account_keypair_path="$PWD/adminAccountKeypair.json"
    admin_authority_keypair_publickey=$(solana-keygen pubkey adminAuthorityKeypair.json)
    admin_authority_keypair_privatekey=$(cat adminAuthorityKeypair.json)
    admin_account_keypair_publickey=$(solana-keygen pubkey adminAccountKeypair.json)
    admin_account_keypair_privatekey=$(cat adminAccountKeypair.json)

    # initialize Content/URSM nodes - initContentNode uses deterministic 
    # addresses and pkeys from eth-contracts ganache chain.
    yarn run ts-node cli/main.ts --function initContentNode \
        --owner-keypair "$owner_wallet_path" \
        --admin-authority-keypair "$admin_authority_keypair_path"\
        --admin-account-keypair "$admin_account_keypair_path" \
        --cn-sp-id 1 \
        --network "$SOLANA_HOST"

    yarn run ts-node cli/main.ts --function initContentNode \
        --owner-keypair "$owner_wallet_path" \
        --admin-authority-keypair "$admin_authority_keypair_path"\
        --admin-account-keypair "$admin_account_keypair_path" \
        --cn-sp-id 2 \
        --network "$SOLANA_HOST"

    yarn run ts-node cli/main.ts --function initContentNode \
        --owner-keypair "$owner_wallet_path" \
        --admin-authority-keypair "$admin_authority_keypair_path"\
        --admin-account-keypair "$admin_account_keypair_path" \
        --cn-sp-id 3 \
        --network "$SOLANA_HOST"

} >&2

# Back up 2 directories to audius-protocol/solana-programs
cd ../../

# TODO follow up PR on cleaning up anchor admin storage naming
cat <<EOF
{
    "anchorProgramId": "$anchor_program_id",
    "anchorAdminPublicKey": "$admin_authority_keypair_publickey",
    "anchorAdminPrivateKey": "$admin_authority_keypair_privatekey",
    "anchorAdminStoragePublicKey": "$admin_account_keypair_publickey",
    "anchorAdminStoragePrivateKey": "$admin_account_keypair_privatekey",
    "trackListenCountAddress": "$track_listen_count_address",
    "audiusEthRegistryAddress": "$audius_eth_registry_address",
    "validSigner": "$valid_signer",
    "signerGroup": "$signer_group",
    "feePayerWallets": [{ "privateKey": $(cat feepayer.json) }],
    "feePayerWalletPubkey": "$feepayer_pubkey",
    "ownerWallet": $owner_wallet,
    "ownerWalletPubkey": "$owner_wallet_pubkey",
    "endpoint": "$SOLANA_HOST",
    "signerPrivateKey": "$priv_key",
    "splToken": "$token",
    "splTokenAccount": "$token_account",
    "claimableTokenAddress": "$claimable_token_address",
    "rewardsManagerAddress": "$rewards_manager_address",
    "rewardsManagerAccount": "$reward_manager_account_key",
    "rewardsManagerTokenAccount": "$reward_manager_token_account_key"
}
EOF
