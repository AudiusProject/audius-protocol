#!/usr/bin/env bash

# Intended to be run on the host dev machine.
# 1. Replaces the program deploy keys and program IDs within them to the dev ones.
# 2. Uses the correct Solana and Anchor versions to build each program.
# 3. Restores the program IDs to not cause any git diff

set -e

# cd into solana-programs
cd $(dirname "$(readlink -f "$0")")/..

LIGHT_GREEN='\033[1;32m'
NO_COLOR='\033[0m'

echo -e ">>> ${LIGHT_GREEN}Updating Program IDs...${NO_COLOR}"
echo
./scripts/update-keys.sh
echo

echo -e ">>> ${LIGHT_GREEN}Changing Solana version to 1.14.18 to build legacy programs...${NO_COLOR}"
echo
solana-install init 1.14.18
echo

echo -e ">>> ${LIGHT_GREEN}Building legacy programs...${NO_COLOR}"
echo
cargo build-bpf
echo

echo -e ">>> ${LIGHT_GREEN}Building legacy programs CLIs...${NO_COLOR}"
echo
cargo build
echo


echo -e ">>> ${LIGHT_GREEN}Changing Solana version to 1.16.9 to build Anchor programs...${NO_COLOR}"
echo
solana-install init 1.16.9
echo

echo -e ">>> ${LIGHT_GREEN}Changing Anchor version to 0.28.0...${NO_COLOR}"
echo
echo avm use 0.28.0
echo

echo -e ">>> ${LIGHT_GREEN}Building payment router...${NO_COLOR}"
echo
cd payment-router/
anchor keys sync
anchor build
cd -
echo

# Prevent any git diff
echo -e ">>> ${LIGHT_GREEN}Restore original program IDs...${NO_COLOR}"
echo
./scripts/update-keys.sh restore
echo