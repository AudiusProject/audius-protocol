if [ -d "../contracts/build/contracts" ]
then
  echo "Audius contracts repo is present"
  cd ../contracts/
  node_modules/.bin/truffle exec scripts/_contractsLocalSetup.js -run-audlib
else
  echo "INCORRECT REPOSITORY STRUCTURE. PLEASE FOLLOW README"
  exit 1
fi
