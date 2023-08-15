
function setup {
  feePayerKeyPairFile=$1
  solana config set -u m
  solana config set -k $feePayerKeyPairFile
}

if $# < 2; then
  echo "Usage: setupCluster.sh <feePayerKeyPairFile>"
  exit 1
fi

echo "Setting up cluster..."
setup $1
