const fs = require('fs')
const path = require('path')
const readline = require('readline')
const ethContractsMigrationOutput = require('../../eth-contracts/migrations/migration-output.json')

// LOCAL DEVELOPMENT ONLY
// Updates audius_eth_contracts_registry in discovery provider
const configureLocalDiscProv = async () => {
  let ethRegistryAddress = ethContractsMigrationOutput.registryAddress
  let envPath = path.join(process.cwd(), '../../', 'discovery-provider/compose/.env')
  await _updateDiscoveryProviderEnvFile(envPath, envPath, ethRegistryAddress)
}

// Write an update to the local discovery provider config .env file
const _updateDiscoveryProviderEnvFile = async (readPath, writePath, ethRegistryAddress) => {
  const fileStream = fs.createReadStream(readPath)
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  })
  let output = []
  let ethRegistryAddressFound = false
  const ethRegistryAddressLine = `audius_eth_contracts_registry=${ethRegistryAddress}`
  for await (const line of rl) {
    if (line.includes('audius_eth_contracts_registry')) {
      output.push(ethRegistryAddressLine)
      ethRegistryAddressFound = true
    } else {
      output.push(line)
    }
  }
  if (!ethRegistryAddressFound) {
    output.push(ethRegistryAddressLine)
  }
  fs.writeFileSync(writePath, output.join('\n'))
  console.log(`Updated DISCOVERY PROVIDER ${writePath} audius_eth_contracts_registry=${ethRegistryAddress}`)
}

configureLocalDiscProv()
