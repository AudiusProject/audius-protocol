# COPY DATA CONTRACTS
if [ -d "../contracts/build/contracts" ]
then
  echo "Audius contracts repo is present"
  cd ../contracts/
  node_modules/.bin/truffle exec scripts/_contractsLocalSetup.js -run-audlib

  echo "Writing config files"
  node_modules/.bin/truffle exec scripts/_contractsLocalSetup.js -run
else
  echo "INCORRECT REPOSITORY STRUCTURE. PLEASE FOLLOW README"
  exit 1
fi

# COPY ETH CONTRACTS
if [ -d "../eth-contracts/build/contracts" ]
then
  echo "Audius eth-contracts repo is present"
  cd ../eth-contracts/
  echo "Writing eth-contracts config files"
  node_modules/.bin/truffle exec scripts/migrate-contracts.js
else
  echo "INCORRECT REPOSITORY STRUCTURE. PLEASE FOLLOW README"
  exit 1
fi
