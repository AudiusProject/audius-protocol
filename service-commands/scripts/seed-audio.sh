get-user-bank () {
    curl "http://dn1_web-server_1:5000/users?id=$1" &> /dev/null | jq .data\[0\].spl_wallet | sed 's/"//g'
}

get-eth-private-key () {
    user_id=$1
    if [[ -z $ETH_PRIVATE_KEY ||  $CUR_USER_ID != $user_id ]]; then
        export ETH_PRIVATE_KEY=$(A seed get-wallet -p --user-id $user_id | grep "Wallet" | awk '{ print $2 }')
        export CUR_USER_ID=$user_id
    fi
    echo $ETH_PRIVATE_KEY
}

seed-audio () {
    user_id=$1
    amount=$2
    echo "Fetching userbank..."
    userBank=$(get-user-bank $user_id)
    echo "Configuring ownerWallet..."
    jq .ownerWallet < ~/.audius/solana-program-config.json > ~/.audius/owner-wallet.json
    echo "Minting Audio..."
    mint=$(jq .splToken < ~/.audius/solana-program-config.json | sed 's/"//g')
    echo "spl-token mint $mint $amount"
    spl-token mint $mint $amount | grep "Signature"
    echo "Transferring..."
    echo "spl-token transfer $mint $amount $userBank"
    spl-token transfer $mint $amount $userBank | grep "Signature"
}

tip-audio () {
    sender_id=$1
    receiver_id=$2
    amount=$3
    sender_eth=$(get-eth-private-key $sender_id)
    receiver_user_bank=$(get-user-bank $receiver_id)
    mint=$(jq .splToken < ~/.audius/solana-program-config.json | sed 's/"//g')
    echo "${PROTOCOL_DIR}/solana-programs/claimable-tokens/cli/target/debug/claimable-tokens-cli transfer $mint $sender_eth $amount --recipient $receiver_user_bank"
    $PROTOCOL_DIR/solana-programs/claimable-tokens/cli/target/debug/claimable-tokens-cli transfer $mint $sender_eth $amount --recipient $receiver_user_bank
}