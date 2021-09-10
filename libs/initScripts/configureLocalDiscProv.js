const fs = require('fs')
const path = require('path')
const readline = require('readline')
const ethContractsMigrationOutput = require('../../eth-contracts/migrations/migration-output.json')
const solanaConfig = require('../../solana-programs/solana-program-config.json')

const ETH_CONTRACTS_REGISTRY = 'audius_eth_contracts_registry'
const SOLANA_TRACK_LISTEN_COUNT_ADDRESS = 'audius_solana_track_listen_count_address'
const SOLANA_ENDPOINT = 'audius_solana_endpoint'

const SOLANA_SIGNER_GROUP_ADDRESS = 'audius_solana_signer_group_address'

const SOLANA_USER_BANK_ADDRESS = 'audius_solana_user_bank_program_address'
const SOLANA_WAUDIO_PROGRAM_ADDRESS = 'audius_solana_waudio_program_address'
const SOLANA_WAUDIO_MINT_ADDRESS = 'audius_solana_waudio_mint_address'

const SOLANA_REWARDS_MANAGER_ADDRESS = 'audius_solana_rewards_manager_program_address'
const SOLANA_REWARDS_MANAGER_ACCOUNT = 'audius_solana_rewards_manager_account'

// LOCAL DEVELOPMENT ONLY
// Updates audius_eth_contracts_registry in discovery provider
const configureLocalDiscProv = async () => {
  const ethRegistryAddress = ethContractsMigrationOutput.registryAddress
  const solanaTrackListenCountAddress = solanaConfig.trackListenCountAddress
  const signerGroup = solanaConfig.signerGroup
  const solanaEndpoint = solanaConfig.endpoint
  const waudioAddress = solanaConfig.splToken
  const waudioMintAddress = solanaConfig.ownerWalletPubkey
  const claimableTokenAddress = solanaConfig.claimableTokenAddress
  const rewardsManagerAddress = solanaConfig.rewardsManagerAddress
  const rewardsManagerAccount = solanaConfig.rewardsManagerAccount
  console.log(`waudioAddress: ${waudioAddress}, claimableTokenAddress: ${claimableTokenAddress}, waudioMintAddress=${waudioMintAddress}`)
  let envPath = path.join(process.cwd(), '../../', 'discovery-provider/compose/.env')

  await _updateDiscoveryProviderEnvFile(
    envPath,
    envPath,
    ethRegistryAddress,
    solanaTrackListenCountAddress,
    solanaEndpoint,
    signerGroup,
    waudioAddress,
    waudioMintAddress,
    claimableTokenAddress,
    rewardsManagerAddress,
    rewardsManagerAccount
  )
}

// Write an update to the local discovery provider config .env file
const _updateDiscoveryProviderEnvFile = async (
  readPath,
  writePath,
  ethRegistryAddress,
  solanaTrackListenCountAddress,
  solanaEndpoint,
  signerGroup,
  waudioAddress,
  waudioMintAddress,
  claimableTokenAddress,
  rewardsManagerAddress,
  rewardsManagerAccount
) => {
  const fileStream = fs.createReadStream(readPath)
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  })
  let output = []
  let ethRegistryAddressFound = false
  let solanaTrackListenCountAddressFound = false
  let solanaEndpointFound = false
  let signerGroupFound = false

  let waudioAddressFound = false
  let waudioMintAddressFound = false
  let claimableTokenAddressFound = false
  let rewardsAddressFound = false
  let rewardsAccountFound = false

  const ethRegistryAddressLine = `${ETH_CONTRACTS_REGISTRY}=${ethRegistryAddress}`
  const solanaTrackListenCountAddressLine = `${SOLANA_TRACK_LISTEN_COUNT_ADDRESS}=${solanaTrackListenCountAddress}`
  const solanaEndpointLine = `${SOLANA_ENDPOINT}=${solanaEndpoint}`
  const signerGroupLine = `${SOLANA_SIGNER_GROUP_ADDRESS}=${signerGroup}`
  const waudioAddressLine = `${SOLANA_WAUDIO_PROGRAM_ADDRESS}=${waudioAddress}`
  const waudioMintAddressLine = `${SOLANA_WAUDIO_MINT_ADDRESS}=${waudioMintAddress}`
  const claimableTokenAddressLine = `${SOLANA_USER_BANK_ADDRESS}=${claimableTokenAddress}`
  const rewardsManagerAddressLine = `${SOLANA_REWARDS_MANAGER_ADDRESS}=${rewardsManagerAddress}`
  const rewardsManagerAccountLine = `${SOLANA_REWARDS_MANAGER_ACCOUNT}=${rewardsManagerAccount}`

  for await (const line of rl) {
    if (line.includes(ETH_CONTRACTS_REGISTRY)) {
      output.push(ethRegistryAddressLine)
      ethRegistryAddressFound = true
    } else if (line.includes(SOLANA_TRACK_LISTEN_COUNT_ADDRESS)) {
      output.push(solanaTrackListenCountAddressLine)
      solanaTrackListenCountAddressFound = true
    } else if (line.includes(SOLANA_ENDPOINT)) {
      output.push(solanaEndpointLine)
      solanaEndpointFound = true
    } else if (line.includes(SOLANA_SIGNER_GROUP_ADDRESS)) {
      output.push(signerGroupLine)
      signerGroupFound = true
    } else if (line.includes(SOLANA_USER_BANK_ADDRESS)) {
      output.push(claimableTokenAddressLine)
      claimableTokenAddressFound = true
    } else if (line.includes(SOLANA_WAUDIO_MINT_ADDRESS)) {
      output.push(waudioMintAddressLine)
      waudioMintAddressFound = true
    } else if (line.includes(SOLANA_WAUDIO_PROGRAM_ADDRESS)) {
      output.push(waudioAddressLine)
      waudioAddressFound = true
    } else if (line.includes(SOLANA_REWARDS_MANAGER_ADDRESS)) {
      output.push(rewardsManagerAddressLine)
      rewardsAddressFound = true
    } else if (line.includes(SOLANA_REWARDS_MANAGER_ACCOUNT)) {
      output.push(rewardsManagerAccountLine)
      rewardsAccountFound = true
    } else {
      output.push(line)
    }
  }
  if (!ethRegistryAddressFound) {
    output.push(ethRegistryAddressLine)
  }
  if (!solanaTrackListenCountAddressFound) {
    output.push(solanaTrackListenCountAddressLine)
  }
  if (!solanaEndpointFound) {
    output.push(solanaEndpointLine)
  }
  if (!signerGroupFound) {
    output.push(signerGroupLine)
  }
  if (!waudioAddressFound) {
    output.push(waudioAddressLine)
  }
  if (!waudioMintAddressFound) {
    output.push(waudioMintAddressLine)
  }
  if (!claimableTokenAddressFound) {
    output.push(claimableTokenAddressLine)
  }
  if (!rewardsAddressFound) {
    output.push(rewardsManagerAddressLine)
  }
  if (!rewardsAccountFound) {
    output.push(rewardsManagerAccountLine)
  }
  fs.writeFileSync(writePath, output.join('\n'))
  console.log(`Updated DISCOVERY PROVIDER ${writePath} ${ETH_CONTRACTS_REGISTRY}=${ethRegistryAddress} ${output}`)
}

configureLocalDiscProv()
