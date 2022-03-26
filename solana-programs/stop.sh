# Spin down solana test validator
if [[ $(lsof -t -i:8899) ]]; then
  kill -9 $(lsof -t -i:8899)
fi