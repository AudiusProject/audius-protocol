const fs = require('fs')
const path = require('path')
const readline = require('readline')
const ethContractsMigrationOutput = require('../../eth-contracts/migrations/migration-output.json')
const solanaConfig = require('../../solana-programs/solana-program-config.json')

// LOCAL DEVELOPMENT ONLY
// Updates audius_eth_contracts_registry in discovery provider
const configureLocalDiscProv = async () => {
  let ethRegistryAddress = ethContractsMigrationOutput.registryAddress
  let solanaProgramAddress = solanaConfig.createAndVerifyAddress
  let solanaEndpoint = solanaConfig.endpoint
  let envPath = path.join(process.cwd(), '../../', 'discovery-provider/compose/.env')

  await _updateDiscoveryProviderEnvFile(
    envPath,
    envPath,
    ethRegistryAddress,
    solanaProgramAddress,
    solanaEndpoint
  )
}

// Write an update to the local discovery provider config .env file
const _updateDiscoveryProviderEnvFile = async (readPath, writePath, ethRegistryAddress, solanaProgramAddress, solanaEndpoint) => {
  const fileStream = fs.createReadStream(readPath)
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  })
  let output = []
  let ethRegistryAddressFound = false
  let solanaProgramAddressFound = false
  let solanaEndpointFound = false
  const ethRegistryAddressLine = `audius_eth_contracts_registry=${ethRegistryAddress}`
  const solanaProgramAddressLine = `audius_solana_program_address=${solanaProgramAddress}`
  const solanaEndpointLine = `audius_solana_endpoint=${solanaEndpoint}`
  for await (const line of rl) {
    if (line.includes('audius_eth_contracts_registry')) {
      output.push(ethRegistryAddressLine)
      ethRegistryAddressFound = true
    } else if (line.includes('audius_solana_program_address')) {
      output.push(solanaProgramAddressLine)
      solanaProgramAddressFound = true
    } else if (line.includes('audius_solana_endpoint')) {
      output.push(solanaEndpointLine)
      solanaEndpointFound = true
    } else {
      output.push(line)
    }
  }
  if (!ethRegistryAddressFound) {
    output.push(ethRegistryAddressLine)
  }
  if (!solanaProgramAddressFound) {
    output.push(solanaProgramAddressLine)
  }
  if (!solanaEndpointFound) {
    output.push(solanaEndpointLine)
  }
  fs.writeFileSync(writePath, output.join('\n'))
  console.log(`Updated DISCOVERY PROVIDER ${writePath} audius_eth_contracts_registry=${ethRegistryAddress}`)
}

configureLocalDiscProv()
