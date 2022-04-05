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
const SOLANA_WAUDIO_MINT = 'audius_solana_waudio_mint'

const SOLANA_REWARDS_MANAGER_ADDRESS = 'audius_solana_rewards_manager_program_address'
const SOLANA_REWARDS_MANAGER_ACCOUNT = 'audius_solana_rewards_manager_account'

const SOLANA_ANCHOR_PROGRAM_ID = 'audius_solana_anchor_data_program_id'
const SOLANA_ANCHOR_ADMIN_STORAGE_KEYPAIR_PUBLIC_KEY = 'audius_solana_anchor_admin_storage_keypair_public_key'

// LOCAL DEVELOPMENT ONLY
// Updates audius_eth_contracts_registry in discovery provider
const configureLocalDiscProv = async () => {
  const ethRegistryAddress = ethContractsMigrationOutput.registryAddress
  const solanaTrackListenCountAddress = solanaConfig.trackListenCountAddress
  const signerGroup = solanaConfig.signerGroup
  const solanaEndpoint = solanaConfig.endpoint
  const waudioMint = solanaConfig.splToken
  const claimableTokenAddress = solanaConfig.claimableTokenAddress
  const rewardsManagerAddress = solanaConfig.rewardsManagerAddress
  const rewardsManagerAccount = solanaConfig.rewardsManagerAccount
  const anchorProgramId = solanaConfig.anchorProgramId
  const anchorAdminStorageKeypairPublicKey = solanaConfig.anchorAdminStorageKeypairPublicKey
  console.log(`waudioAddress: ${waudioMint}, claimableTokenAddress: ${claimableTokenAddress}, waudioMint=${waudioMint}`)
  const envPath = path.join(process.cwd(), '../../', 'discovery-provider/compose/.env')

  await _updateDiscoveryProviderEnvFile(
    envPath,
    envPath,
    ethRegistryAddress,
    solanaTrackListenCountAddress,
    solanaEndpoint,
    signerGroup,
    waudioMint,
    claimableTokenAddress,
    rewardsManagerAddress,
    rewardsManagerAccount,
    anchorProgramId,
    anchorAdminStorageKeypairPublicKey,
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
  waudioMint,
  claimableTokenAddress,
  rewardsManagerAddress,
  rewardsManagerAccount,
  anchorProgramId,
  anchorAdminStorageKeypairPublicKey,
) => {
  const fileStream = fs.createReadStream(readPath)
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  })
  const output = []
  let ethRegistryAddressFound = false
  let solanaTrackListenCountAddressFound = false
  let solanaEndpointFound = false
  let signerGroupFound = false

  let waudioMintFound = false
  let claimableTokenAddressFound = false
  let rewardsAddressFound = false
  let rewardsAccountFound = false
  let anchorProgramIdFound = false
  let anchorAdminStorageKeypairPublicKeyFound = false

  const ethRegistryAddressLine = `${ETH_CONTRACTS_REGISTRY}=${ethRegistryAddress}`
  const solanaTrackListenCountAddressLine = `${SOLANA_TRACK_LISTEN_COUNT_ADDRESS}=${solanaTrackListenCountAddress}`
  const solanaEndpointLine = `${SOLANA_ENDPOINT}=${solanaEndpoint}`
  const signerGroupLine = `${SOLANA_SIGNER_GROUP_ADDRESS}=${signerGroup}`
  const waudioMintLine = `${SOLANA_WAUDIO_MINT}=${waudioMint}`
  const claimableTokenAddressLine = `${SOLANA_USER_BANK_ADDRESS}=${claimableTokenAddress}`
  const rewardsManagerAddressLine = `${SOLANA_REWARDS_MANAGER_ADDRESS}=${rewardsManagerAddress}`
  const rewardsManagerAccountLine = `${SOLANA_REWARDS_MANAGER_ACCOUNT}=${rewardsManagerAccount}`
  const anchorProgramIdLine = `${SOLANA_ANCHOR_PROGRAM_ID}=${anchorProgramId}`
  const anchorAdminStorageKeypairPublicKeyLine = `${SOLANA_ANCHOR_ADMIN_STORAGE_KEYPAIR_PUBLIC_KEY}=${anchorAdminStorageKeypairPublicKey}`

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
    } else if (line.includes(SOLANA_WAUDIO_MINT)) {
      output.push(waudioMintLine)
      waudioMintFound = true
    } else if (line.includes(SOLANA_REWARDS_MANAGER_ADDRESS)) {
      output.push(rewardsManagerAddressLine)
      rewardsAddressFound = true
    } else if (line.includes(SOLANA_REWARDS_MANAGER_ACCOUNT)) {
      output.push(rewardsManagerAccountLine)
      rewardsAccountFound = true
    } else if (line.includes(SOLANA_ANCHOR_PROGRAM_ID)) {
      output.push(anchorProgramIdLine)
      anchorProgramIdFound = true
    } else if (line.includes(SOLANA_ANCHOR_ADMIN_STORAGE_KEYPAIR_PUBLIC_KEY)) {
      output.push(anchorAdminStorageKeypairPublicKeyLine)
      anchorAdminStorageKeypairPublicKeyFound = true
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
  if (!waudioMintFound) {
    output.push(waudioMintLine)
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
  if (!anchorProgramIdFound) {
    output.push(anchorProgramIdLine)
  }
  if (!anchorAdminStorageKeypairPublicKeyFound) {
    output.push(anchorAdminStorageKeypairPublicKeyLine)
  }
  fs.writeFileSync(writePath, output.join('\n'))
  console.log(`Updated DISCOVERY PROVIDER ${writePath} ${ETH_CONTRACTS_REGISTRY}=${ethRegistryAddress} ${output}`)
}

configureLocalDiscProv()
