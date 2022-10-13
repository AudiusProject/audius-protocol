const migrationOutput = require('../migrations/migration-output.json');

const Registry = artifacts.require('Registry');

async function main() {
  const registry = await Registry.at(migrationOutput.registryAddress);
  console.log(await registry.getContract(web3.utils.utf8ToHex(process.argv.at(-1))));
}

module.exports = (callback) => {
  main()
    .then(callback)
    .catch(callback);
}
