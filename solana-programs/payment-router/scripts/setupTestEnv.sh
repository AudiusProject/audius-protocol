if [ $# -lt 1 ]; then
  echo "Usage: setupTestEnv.sh <fee-payer-keypair-file>"
  exit 1
fi

feePayerKeyPairFile=$1

function setup_cluster {
  echo "Setting up cluster..."
  echo "=========="
  solana config set -u m -k $feePayerKeyPairFile
  echo "Your SOL balance is: "
  solana balance
  echo "=========="
  echo "You are now set up to interact with Solana mainnet."
}

setup_cluster
