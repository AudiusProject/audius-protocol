# Gets the spl-token wallet from the discovery node api
get-user-bank () {
    curl "http://dn1_web-server_1:5000/users?id=$1" &> /dev/null | jq -rc .data\[0\].spl_wallet
}

# Gets the private key for a wallet out of the seed cache
get-eth-private-key () {
    jq -rc "map(select(.userId==$1).wallet.privKey)[0]" < ~/.audius/seed-cache.json
}

# Mints $AUDIO and transfers it to a user bank
seed-audio () {
    user_id=$1
    amount=$2
    echo "Fetching userbank..."
    userBank=$(get-user-bank $user_id)
    echo "Configuring ownerWallet..."
    jq .ownerWallet < ~/.audius/solana-program-config.json > ~/.audius/owner-wallet.json
    solana config set -k ~/.audius/owner-wallet.json
    echo "Minting Audio..."
    mint=$(jq -rc .splToken < ~/.audius/solana-program-config.json)
    echo "spl-token mint $mint $amount"
    spl-token mint $mint $amount | grep "Signature"
    echo "Transferring..."
    echo "spl-token transfer $mint $amount $userBank"
    spl-token transfer $mint $amount $userBank | grep "Signature"
}

# Transfer audio from user bank to user bank
tip-audio () {
    sender_id=$1
    receiver_id=$2
    amount=$3
    sender_eth=$(get-eth-private-key $sender_id)
    receiver_user_bank=$(get-user-bank $receiver_id)
    mint=$(jq -rc .splToken < ~/.audius/solana-program-config.json)
    echo "${PROTOCOL_DIR}/solana-programs/claimable-tokens/cli/target/debug/claimable-tokens-cli transfer $mint $sender_eth $amount --recipient $receiver_user_bank"
    $PROTOCOL_DIR/solana-programs/claimable-tokens/cli/target/debug/claimable-tokens-cli transfer $mint $sender_eth $amount --recipient $receiver_user_bank
}