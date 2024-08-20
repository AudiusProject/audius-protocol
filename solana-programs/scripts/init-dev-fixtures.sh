#!/bin/bash

set -e

cd $(dirname "$(readlink -f "$0")")/..

echo $PWD

set -a
source  ../dev-tools/compose/.env
set +a

solana -V
solana config set -ul

echo "-------------- Generating Accounts --------------"

echo "Generating owner account"
owner_keypair=$HOME/.config/solana/id.json
if [[ "$SOLANA_OWNER_SECRET_KEY" != "" ]]; then
    echo "$SOLANA_OWNER_SECRET_KEY" >$owner_keypair
else
    solana-keygen new -s -f --no-bip39-passphrase -o "$owner_keypair"
fi
solana address
echo

echo "Generating feepayer account"
feepayer_keypair=$HOME/.config/solana/keypair.json
if [[ "$SOLANA_FEEPAYER_SECRET_KEY" != "" ]]; then
    echo "$SOLANA_FEEPAYER_SECRET_KEY" >$feepayer_keypair
else
    solana-keygen new -s -f --no-bip39-passphrase -o "$feepayer_keypair"
fi
solana address -k "$feepayer_keypair"
echo

echo "Generating token keypair"
token_keypair=$HOME/.config/solana/token.json
if [[ "$SOLANA_TOKEN_MINT_SECRET_KEY" != "" ]]; then
    echo "$SOLANA_TOKEN_MINT_SECRET_KEY" >$token_keypair
else
    solana-keygen new -s -f --no-bip39-passphrase -o "$token_keypair"
fi
solana address -k "$token_keypair"
echo

echo "Generating fake USDC token keypair"
fake_usdc_token_keypair=$HOME/.config/solana/fake-usdc-token.json
if [[ "$SOLANA_USDC_TOKEN_MINT_SECRET_KEY" != "" ]]; then
    echo "$SOLANA_USDC_TOKEN_MINT_SECRET_KEY" >$fake_usdc_token_keypair
else
    solana-keygen new -s -f --no-bip39-passphrase -o "$fake_usdc_token_keypair"
fi
solana address -k "$fake_usdc_token_keypair"
echo

echo "Generating signer group keypair"
signer_group_keypair=$HOME/.config/solana/signer-group.json
if [[ "$SOLANA_SIGNER_GROUP_SECRET_KEY" != "" ]]; then
    echo "$SOLANA_SIGNER_GROUP_SECRET_KEY" >$signer_group_keypair
else
    solana-keygen new -s -f --no-bip39-passphrase -o "$signer_group_keypair"
fi
solana address -k "$signer_group_keypair"
echo

echo "Generating valid signer keypair"
valid_signer_keypair=$HOME/.config/solana/valid-signer.json
if [[ "$SOLANA_VALID_SIGNER_SECRET_KEY" != "" ]]; then
    echo "$SOLANA_VALID_SIGNER_SECRET_KEY" >$valid_signer_keypair
else
    solana-keygen new -s -f --no-bip39-passphrase -o "$valid_signer_keypair"
fi
solana address -k "$valid_signer_keypair"
echo

echo "Generating reward manager keypair"
reward_manager_pda_keypair=$HOME/.config/solana/reward-manager.json
if [[ "$SOLANA_REWARD_MANAGER_PDA_SECRET_KEY" != "" ]]; then
    echo "$SOLANA_REWARD_MANAGER_PDA_SECRET_KEY" >$reward_manager_pda_keypair
else
    solana-keygen new -s -f --no-bip39-passphrase -o "$reward_manager_pda_keypair"
fi
solana address -k "$reward_manager_pda_keypair"
echo

echo "Generating reward manager token keypair"
reward_manager_token_pda_keypair=$HOME/.config/solana/reward-manager-token.json
if [[ "$SOLANA_REWARD_MANAGER_TOKEN_PDA_SECRET_KEY" != "" ]]; then
    echo "$SOLANA_REWARD_MANAGER_TOKEN_PDA_SECRET_KEY" >$reward_manager_token_pda_keypair
else
    solana-keygen new -s -f --no-bip39-passphrase -o "$reward_manager_token_pda_keypair"
fi
solana address -k "$reward_manager_token_pda_keypair"
echo

echo "---------------- Airdrop solana -----------------"

echo "Airdropping to owner account"
solana airdrop 100 "$owner_keypair"
echo

echo "Airdropping to feepayer account"
solana --commitment finalized airdrop 100 "$feepayer_keypair"
echo

echo "------------- Deploying tokens ----------------"

echo "Deploying wAUDIO token..."
spl-token create-token --decimals 8 -- "$token_keypair"
echo

echo "Deploying fake UDSC token..."
spl-token create-token --decimals 6 -- "$fake_usdc_token_keypair"
echo

echo "------------- Initialize programs ---------------"

echo "Creating a signer group..."
./target/debug/audius-eth-registry-cli create-signer-group "$signer_group_keypair"
echo

echo "Creating a valid signer..."
echo "$ETH_VALID_SIGNER_ADDRESS"
./target/debug/audius-eth-registry-cli create-valid-signer \
    "$(solana address -k "$signer_group_keypair")" \
    "$(echo $ETH_VALID_SIGNER_ADDRESS | tail -c+3)" \
    "$valid_signer_keypair"
echo

echo "Initalizing reward manager..."
./target/debug/audius-reward-manager-cli init \
    --keypair "$reward_manager_pda_keypair" \
    --token-keypair "$reward_manager_token_pda_keypair" \
    --min-votes 3 \
    --token-mint "$(solana address -k $token_keypair)"
echo

echo "Minting 100000000 wAUDIO to reward manager..."
spl-token mint "$(solana address -k "$token_keypair")" 100000000 -- "$(solana address -k "$reward_manager_token_pda_keypair")"
echo

echo "------------- Creating fixtures  ---------------"

mkdir -p ./fixtures

echo "Owner account:"
solana account --output json-compact --output-file ./fixtures/owner.json "$(solana address -k "$owner_keypair")"
echo

echo "Fee payer account:"
solana account --output json-compact --output-file ./fixtures/fee-payer.json "$(solana address -k "$feepayer_keypair")"
echo

echo "wAUDIO token mint:"
solana account --output json-compact --output-file ./fixtures/waudio.json "$(solana address -k "$token_keypair")"
echo

echo "Fake USDC token mint:"
solana account --output json-compact --output-file ./fixtures/usdc.json "$(solana address -k "$fake_usdc_token_keypair")"
echo

echo "Eth Registry signer group account:"
solana account --output json-compact --output-file ./fixtures/eth-registry-signer-group.json "$(solana address -k "$signer_group_keypair")"
echo

echo "Eth Registry valid signer account:"
solana account --output json-compact --output-file ./fixtures/eth-registry-valid-signer.json "$(solana address -k "$valid_signer_keypair")"
echo

echo "Reward Manager State account:"
solana account --output json-compact --output-file ./fixtures/reward-manager-state.json "$(solana address -k "$reward_manager_pda_keypair")"
echo

echo "Reward Manager token disbursement account:"
solana account --output json-compact --output-file ./fixtures/reward-manager-tokens.json "$(solana address -k "$reward_manager_token_pda_keypair")"
echo