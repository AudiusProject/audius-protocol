const AUDIUS_CONFIG = '.audius/config.json'
const AUDIUS_SOL_CONFIG = '.audius/solana-program-config.json'
const AUDIUS_ETH_CONFIG = '.audius/eth-config.json'
const AAO_CONFIG = '.audius/aao-config.json'

const fs = require('fs')
const path = require('path')
const homeDir = require('os').homedir()

let HOST = 'localhost'
if (process.argv[2] && process.argv[2] === '--remote-host') {
  HOST = process.env.AUDIUS_REMOTE_DEV_HOST
  if (!HOST) {
    throw new Error(
      'Misconfigured local env. Ensure AUDIUS_REMOTE_DEV_HOST envvar has been exported.'
    )
  }
  if (HOST.trim() !== HOST) {
    throw new Error(
      `Invisible characters detected in $AUDIUS_REMOTE_DEV_HOST: '${HOST}'`
    )
  }
}

try {
  const configFile = require(path.join(homeDir, AUDIUS_CONFIG))
  const ethConfigFile = require(path.join(homeDir, AUDIUS_ETH_CONFIG))
  const solConfigFile = require(path.join(homeDir, AUDIUS_SOL_CONFIG))
  const aaoConfigFile = require(path.join(homeDir, AAO_CONFIG))

  const REACT_APP_ENVIRONMENT = 'development'
  const REACT_APP_EAGER_DISCOVERY_NODES = 'http://dn1_web-server_1:5000'
  const REACT_APP_IDENTITY_SERVICE = `http://${HOST}:7000`
  const REACT_APP_USER_NODE = 'http://cn-um_creator-node_1:4099'

  const REACT_APP_REGISTRY_ADDRESS = configFile.registryAddress
  const REACT_APP_ENTITY_MANAGER_ADDRESS = configFile.entityManagerProxyAddress
  const REACT_APP_WEB3_PROVIDER_URLS = `http://${HOST}:8545,http://${HOST}:8545`

  const REACT_APP_ETH_REGISTRY_ADDRESS = ethConfigFile.registryAddress
  const REACT_APP_ETH_PROVIDER_URL = `http://${HOST}:8546`
  const REACT_APP_ETH_TOKEN_ADDRESS = ethConfigFile.audiusTokenAddress
  const REACT_APP_ETH_OWNER_WALLET = ethConfigFile.ownerWallet

  const REACT_APP_CLAIMABLE_TOKEN_PROGRAM_ADDRESS =
    solConfigFile.claimableTokenAddress
  const REACT_APP_REWARDS_MANAGER_PROGRAM_ID =
    solConfigFile.rewardsManagerAddress
  const REACT_APP_REWARDS_MANAGER_PROGRAM_PDA =
    solConfigFile.rewardsManagerAccount
  const REACT_APP_REWARDS_MANAGER_TOKEN_PDA =
    solConfigFile.rewardsManagerTokenAccount
  const REACT_APP_SOLANA_TOKEN_PROGRAM_ADDRESS =
    'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
  const REACT_APP_SOLANA_WEB3_CLUSTER = 'devnet'
  const REACT_APP_SOLANA_CLUSTER_ENDPOINT = `http://${HOST}:8899`
  const REACT_APP_WAUDIO_MINT_ADDRESS = solConfigFile.splToken
  const REACT_APP_SOLANA_FEE_PAYER_ADDRESS = solConfigFile.feePayerWalletPubkey
  const REACT_APP_ANCHOR_PROGRAM_ID = solConfigFile.anchorProgramId
  const REACT_APP_ANCHOR_ADMIN_ACCOUNT =
    solConfigFile.anchorAdminStoragePublicKey

  const REACT_APP_ORACLE_ETH_ADDRESSES = aaoConfigFile.join(',')
  const REACT_APP_AAO_ENDPOINT = `http://${HOST}:8000`

  const REACT_APP_METADATA_PROGRAM_ID =
    'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s'

  const REACT_APP_RECAPTCHA_SITE_KEY =
    '6LfVR-0ZAAAAADFcqNM1P1IafKwQwN0E_l-gxQ9q'
  const REACT_APP_HCAPTCHA_SITE_KEY = '2abe61f1-af6e-4707-be19-a9a4146a9bea'

  const REACT_APP_COGNITO_KEY =
    'sandbox_publishable_key_e61e1acfe63bd1760827b68d4f00245b'
  const REACT_APP_COGNITO_TEMPLATE_ID = 'flwtmp_7ZUYaBUFLeNhJw'

  const REACT_APP_OPENSEA_API_URL = 'https://rinkeby-api.opensea.io/api/v1'

  const contents = `
  # DO NOT MODIFY. SEE /scripts/configureLocalEnv.js

  REACT_APP_ENVIRONMENT=${REACT_APP_ENVIRONMENT}

  REACT_APP_EAGER_DISCOVERY_NODES=${REACT_APP_EAGER_DISCOVERY_NODES}
  REACT_APP_IDENTITY_SERVICE=${REACT_APP_IDENTITY_SERVICE}
  REACT_APP_USER_NODE=${REACT_APP_USER_NODE}

  REACT_APP_REGISTRY_ADDRESS=${REACT_APP_REGISTRY_ADDRESS}
  REACT_APP_ENTITY_MANAGER_ADDRESS=${REACT_APP_ENTITY_MANAGER_ADDRESS}
  REACT_APP_WEB3_PROVIDER_URL=${REACT_APP_WEB3_PROVIDER_URLS}

  REACT_APP_ETH_REGISTRY_ADDRESS=${REACT_APP_ETH_REGISTRY_ADDRESS}
  REACT_APP_ETH_PROVIDER_URL=${REACT_APP_ETH_PROVIDER_URL}
  REACT_APP_ETH_TOKEN_ADDRESS=${REACT_APP_ETH_TOKEN_ADDRESS}
  REACT_APP_ETH_OWNER_WALLET=${REACT_APP_ETH_OWNER_WALLET}

  REACT_APP_RECAPTCHA_SITE_KEY=${REACT_APP_RECAPTCHA_SITE_KEY}
  REACT_APP_HCAPTCHA_SITE_KEY=${REACT_APP_HCAPTCHA_SITE_KEY}

  REACT_APP_COGNITO_KEY=${REACT_APP_COGNITO_KEY}
  REACT_APP_COGNITO_TEMPLATE_ID=${REACT_APP_COGNITO_TEMPLATE_ID}

  REACT_APP_OPENSEA_API_URL=${REACT_APP_OPENSEA_API_URL}
  REACT_APP_CLAIMABLE_TOKEN_PROGRAM_ADDRESS=${REACT_APP_CLAIMABLE_TOKEN_PROGRAM_ADDRESS}
  REACT_APP_SOLANA_TOKEN_PROGRAM_ADDRESS=${REACT_APP_SOLANA_TOKEN_PROGRAM_ADDRESS}
  REACT_APP_SOLANA_CLUSTER_ENDPOINT=${REACT_APP_SOLANA_CLUSTER_ENDPOINT}
  REACT_APP_SOLANA_WEB3_CLUSTER=${REACT_APP_SOLANA_WEB3_CLUSTER}
  REACT_APP_WAUDIO_MINT_ADDRESS=${REACT_APP_WAUDIO_MINT_ADDRESS}
  REACT_APP_SOLANA_FEE_PAYER_ADDRESS=${REACT_APP_SOLANA_FEE_PAYER_ADDRESS}
  REACT_APP_ANCHOR_PROGRAM_ID=${REACT_APP_ANCHOR_PROGRAM_ID}
  REACT_APP_ANCHOR_ADMIN_ACCOUNT=${REACT_APP_ANCHOR_ADMIN_ACCOUNT}
  REACT_APP_REWARDS_MANAGER_PROGRAM_ID=${REACT_APP_REWARDS_MANAGER_PROGRAM_ID}
  REACT_APP_REWARDS_MANAGER_PROGRAM_PDA=${REACT_APP_REWARDS_MANAGER_PROGRAM_PDA}
  REACT_APP_REWARDS_MANAGER_TOKEN_PDA=${REACT_APP_REWARDS_MANAGER_TOKEN_PDA}

  REACT_APP_METADATA_PROGRAM_ID=${REACT_APP_METADATA_PROGRAM_ID}

  REACT_APP_ORACLE_ETH_ADDRESSES=${REACT_APP_ORACLE_ETH_ADDRESSES}
  REACT_APP_AAO_ENDPOINT=${REACT_APP_AAO_ENDPOINT}

  REACT_APP_USE_HASH_ROUTING=false
  `

  // Note .env.dev.local takes precidence over .env.dev
  // https://facebook.github.io/create-react-app/docs/adding-custom-environment-variables
  fs.writeFile('./.env/.env.dev.local', contents, (err) => {
    if (err) {
      console.error(err)
    }
    console.log('Configured .env.dev.local')
  })
} catch (e) {
  console.log(`Error configuring local env: ${e}`)
  console.error(`
    Did not find ~/${AUDIUS_CONFIG} configuration file.
    See https://github.com/AudiusProject/audius-e2e-tests to configure a local dev environment.
  `)
}
