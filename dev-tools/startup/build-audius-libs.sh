#!/usr/bin/env sh

set -e

cat > strip_abi.js <<EOF
const fs = require("fs")
const abi = JSON.parse(fs.readFileSync(0, "utf-8"));
console.log(JSON.stringify({ contractName: abi.contractName, abi: abi.abi }));
EOF

for abi in ../data-contracts/ABIs/*; do
  node strip_abi.js < "$abi" > data-contracts/ABIs/$(basename "$abi")
done

for abi in ../eth-contracts/ABIs/*; do
  node strip_abi.js < "$abi" > eth-contracts/ABIs/$(basename "$abi")
done

cp scripts/AudiusClaimDistributor.json scripts/Wormhole.json eth-contracts/ABIs/

npx rollup -c -w
