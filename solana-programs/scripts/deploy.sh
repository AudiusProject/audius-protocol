#!/bin/bash

set -e

function airdrop_till {
    failed=0
    while [[ "$(solana balance $1 | sed 's/\(\.\| \).*//')" < "$2" ]]; do
        # NOTE: adjust number below if running against a diffrent endpoint
        solana airdrop 10 $1 || failed=$((failed + $?))
        if [[ $failed == 5 ]]; then
            echo "Failed to airdrop $2 to $1"
            exit 1
        fi

        sleep 1
    done
}

cd $(dirname "$(readlink -f "$0")")/..

solana -V
solana config set -u "$SOLANA_HOST"

# TODO: Remove this when we deprecate service-commands
if [[ "$valid_signer_eth_address" != "" ]]; then
    valid_signer_eth_address=0xc7dE2857e17dc213C42eEd938A685b8FeF958088
    valid_signer_eth_private_key=0xd242765e718801781440d77572b9dafcdc9baadf0269eff24cf61510ddbf1003
fi

echo "----------- Waiting for $SOLANA_HOST ------------"

# the address below does not matter
failed=0
while ! solana balance CMRCuQcnbzHzQfDRZfkfAXM9TKce1X6LjHhSLqQc68WU >/dev/null 2>&1; do
    failed=$(($failed + 1))
    echo "Retrying...$failed"
    sleep 1
done

echo "-------------- Generating Accounts --------------"

echo "Generating owner account"
owner_keypair=$HOME/.config/solana/id.json
if [[ "$owner_private_key" != "" ]]; then
    echo "$owner_private_key" >$owner_keypair
else
    solana-keygen new -s -f --no-bip39-passphrase -o "$owner_keypair"
fi
solana address
echo

echo "Generating feepayer account"
feepayer_keypair=$HOME/.config/solana/keypair.json
if [[ "$feepayer_private_key" != "" ]]; then
    echo "$feepayer_private_key" >$feepayer_keypair
else
    solana-keygen new -s -f --no-bip39-passphrase -o "$feepayer_keypair"
fi
solana address -k "$feepayer_keypair"
echo

echo "Generating token keypair"
token_keypair=$HOME/.config/solana/token.json
if [[ "$token_private_key" != "" ]]; then
    echo "$token_private_key" >$token_keypair
else
    solana-keygen new -s -f --no-bip39-passphrase -o "$token_keypair"
fi
solana address -k "$token_keypair"
echo

echo "Generating fake USDC token keypair"
fake_usdc_token_keypair=$HOME/.config/solana/fake-usdc-token.json
if [[ "$fake_usdc_token_private_key" != "" ]]; then
    echo "$fake_usdc_token_private_key" >$fake_usdc_token_keypair
else
    solana-keygen new -s -f --no-bip39-passphrase -o "$fake_usdc_token_keypair"
fi
solana address -k "$fake_usdc_token_keypair"
echo

echo "Generating signer group keypair"
signer_group_keypair=$HOME/.config/solana/signer-group.json
if [[ "$signer_group_private_key" != "" ]]; then
    echo "$signer_group_private_key" >$signer_group_keypair
else
    solana-keygen new -s -f --no-bip39-passphrase -o "$signer_group_keypair"
fi
solana address -k "$signer_group_keypair"
echo

echo "Generating valid signer keypair"
valid_signer_keypair=$HOME/.config/solana/valid-signer.json
if [[ "$valid_signer_private_key" != "" ]]; then
    echo "$valid_signer_private_key" >$valid_signer_keypair
else
    solana-keygen new -s -f --no-bip39-passphrase -o "$valid_signer_keypair"
fi
solana address -k "$valid_signer_keypair"
echo

echo "Generating reward manager keypair"
reward_manager_pda_keypair=$HOME/.config/solana/reward-manager.json
if [[ "$reward_manager_pda_private_key" != "" ]]; then
    echo "$reward_manager_pda_private_key" >$reward_manager_pda_keypair
else
    solana-keygen new -s -f --no-bip39-passphrase -o "$reward_manager_pda_keypair"
fi
solana address -k "$reward_manager_pda_keypair"
echo

echo "Generating reward manager token keypair"
reward_manager_token_pda_keypair=$HOME/.config/solana/reward-manager-token.json
if [[ "$reward_manager_token_pda_private_key" != "" ]]; then
    echo "$reward_manager_token_pda_private_key" >$reward_manager_token_pda_keypair
else
    solana-keygen new -s -f --no-bip39-passphrase -o "$reward_manager_token_pda_keypair"
fi
solana address -k "$reward_manager_token_pda_keypair"
echo

echo "---------------- Airdrop solana -----------------"

echo "Airdropping to owner account"
airdrop_till "$owner_keypair" 100
echo

echo "Airdropping to feepayer account"
airdrop_till "$feepayer_keypair" 100
echo

echo "------------- Deploying programs ----------------"

echo "Deploying audius-eth-registry..."
solana program deploy target/deploy/audius_eth_registry.so
echo

echo "Deploying audius-track-listen-count..."
solana program deploy target/deploy/track_listen_count.so
echo

echo "Deploying audius-claimable-tokens..."
solana program deploy target/deploy/claimable_tokens.so
echo

echo "Deploying audius-reward-manager..."
solana program deploy target/deploy/audius_reward_manager.so
echo

echo "Deploying payment-router..."
solana program deploy target/deploy/payment_router.so
echo

echo "Deploying wAUDIO token..."
spl-token create-token --decimals 8 -- "$token_keypair"
echo

echo "Deploying fake UDSC token..."
spl-token create-token --decimals 6 -- "$fake_usdc_token_keypair"
echo

echo "------------- Initialize programs ---------------"

echo "Creating a signer group..."
audius-eth-registry-cli create-signer-group "$signer_group_keypair"
echo

if [[ "$valid_signer_eth_address" != "" ]]; then
    echo "Creating a valid signer..."
    echo "$valid_signer_eth_address"
    audius-eth-registry-cli create-valid-signer \
        "$(solana address -k "$signer_group_keypair")" \
        "$(echo $valid_signer_eth_address | tail -c+3)" \
        "$valid_signer_keypair"
    echo
fi

echo "Creating wAUDIO token account..."
spl-token create-account "$(solana address -k "$token_keypair")"
echo

echo "Minting 100,000,000 wAUDIO..."
spl-token mint "$(solana address -k "$token_keypair")" 100000000
echo

echo "Creating USDC token account for owner..."
spl-token create-account "$(solana address -k "$fake_usdc_token_keypair")"
echo

echo "Minting 100,000,000 USDC to owner..."
spl-token mint "$(solana address -k "$fake_usdc_token_keypair")" 100000000
echo

echo "Initalizing claimable tokens..."
claimable-tokens-cli generate-base-pda \
    "$(solana address -k "$token_keypair")" \
    "$(solana address -k target/deploy/claimable_tokens-keypair.json)"
echo

# TODO: PAY-2001: Re-deploy this with min-votes 3
echo "Initalizing reward manager..."
audius-reward-manager-cli init \
    --keypair "$reward_manager_pda_keypair" \
    --token-keypair "$reward_manager_token_pda_keypair" \
    --min-votes 2 \
    --token-mint "$(solana address -k $token_keypair)"
echo

echo "Transferring wAUDIO to reward manager..."
spl-token transfer \
    "$(solana address -k $token_keypair)" \
    100000000 \
    "$(solana address -k "$reward_manager_token_pda_keypair")"
echo

# TODO: Remove this when we deprecate service-commands
cat >solana-program-config.json <<EOF
{
    "trackListenCountAddress": "$(solana address -k target/deploy/track_listen_count-keypair.json)",
    "audiusEthRegistryAddress": "$(solana address -k target/deploy/audius_eth_registry-keypair.json)",
    "validSigner": "$(solana address -k "$valid_signer_keypair")",
    "signerGroup": "$(solana address -k "$signer_group_keypair")",
    "feePayerWallets": [{ "privateKey": $(cat "$feepayer_keypair") }],
    "feePayerWalletPubkey": "$(solana address -k "$feepayer_keypair")",
    "ownerWallet": $(cat "$owner_keypair"),
    "ownerWalletPubkey": "$(solana address -k "$owner_keypair")",
    "endpoint": "$SOLANA_HOST",
    "signerPrivateKey": "$valid_signer_eth_private_key",
    "splToken": "$(solana address -k "$token_keypair")",
    "fakeUSDCTokenMint": "$(solana address -k "$fake_usdc_token_keypair")",
    "claimableTokenAddress": "$(solana address -k target/deploy/claimable_tokens-keypair.json)",
    "rewardsManagerAddress": "$(solana address -k target/deploy/audius_reward_manager-keypair.json)",
    "paymentRouterAddress": "$(solana address -k target/deploy/payment_router-keypair.json)",
    "rewardsManagerAccount": "$(solana address -k "$reward_manager_pda_keypair")",
    "rewardsManagerTokenAccount": "$(solana address -k "$reward_manager_token_pda_keypair")"
}
EOF
