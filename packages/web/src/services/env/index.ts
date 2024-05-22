import { env as envDev } from './env.dev'
import { env as envProd } from './env.prod'
import { env as envStage } from './env.stage'

type Environment = 'development' | 'staging' | 'production'

type Env = {
  AAO_ENDPOINT: string
  AMPLITUDE_API_KEY: string | null
  AMPLITUDE_PROXY: string | null
  AMPLITUDE_WRITE_KEY: string | null
  AUDIUS_URL: string
  BITSKI_CALLBACK_URL: string
  BITSKI_CLIENT_ID: string
  CACHE_PRUNE_MIN: string
  CLAIM_DISTRIBUTION_CONTRACT_ADDRESS: string | null
  CLAIMABLE_TOKEN_PDA: string
  CLAIMABLE_TOKEN_PROGRAM_ADDRESS: string
  COINFLOW_APP_ID: string
  COINFLOW_MERCHANT_ID: string
  COINFLOW_PARTNER_ID: string
  COGNITO_KEY: string | null
  COGNITO_TEMPLATE_ID: string | null
  EAGER_DISCOVERY_NODES: string
  ENTITY_MANAGER_ADDRESS: string
  ENVIRONMENT: Environment
  ETH_BRIDGE_ADDRESS: string | null
  ETH_NETWORK_ID: string
  ETH_OWNER_WALLET: string | null
  ETH_PROVIDER_URL: string
  ETH_REGISTRY_ADDRESS: string
  ETH_TOKEN_ADDRESS: string
  ETH_TOKEN_BRIDGE_ADDRESS: string | null
  EXPLORE_CONTENT_URL: string
  FCM_PUSH_PUBLIC_KEY: string | null
  FINGERPRINT_ENDPOINT: string | null
  FINGERPRINT_PUBLIC_API_KEY: string | null
  GA_HOSTNAME: string
  GA_MEASUREMENT_ID: string
  GENERAL_ADMISSION: string
  HCAPTCHA_BASE_URL: string
  HCAPTCHA_SITE_KEY: string
  IDENTITY_SERVICE: string
  INSTAGRAM_APP_ID: string
  INSTAGRAM_REDIRECT_URL: string
  LOOKUP_TABLE_ADDRESS: string
  METADATA_PROGRAM_ID: string
  OPENSEA_API_URL: string
  HELIUS_DAS_API_URL: string
  OPTIMIZELY_KEY: string
  ORACLE_ETH_ADDRESSES: string
  PAYMENT_ROUTER_PROGRAM_ID: string
  PUBLIC_HOSTNAME: string
  PUBLIC_PROTOCOL: string
  BASENAME: string
  REACHABILITY_URL: string
  STRIPE_CLIENT_PUBLISHABLE_KEY: string
  RECAPTCHA_SITE_KEY: string
  REGISTRY_ADDRESS: string
  REWARDS_MANAGER_PROGRAM_ID: string
  REWARDS_MANAGER_PROGRAM_PDA: string
  REWARDS_MANAGER_TOKEN_PDA: string
  SAFARI_WEB_PUSH_ID: string
  SCHEME: string
  SENTRY_DSN: string
  SOL_BRIDGE_ADDRESS: string | null
  SOL_TOKEN_BRIDGE_ADDRESS: string | null
  SOLANA_CLUSTER_ENDPOINT: string
  SOLANA_FEE_PAYER_ADDRESS: string
  SOLANA_RELAY_ENDPOINT: string
  SOLANA_TOKEN_PROGRAM_ADDRESS: string
  SOLANA_WEB3_CLUSTER: string
  SUGGESTED_FOLLOW_HANDLES: string
  TIKTOK_APP_ID: string
  TRPC_ENDPOINT: string
  USDC_MINT_ADDRESS: string
  USER_NODE: string
  USE_HASH_ROUTING: boolean
  WAUDIO_MINT_ADDRESS: string
  WEB3_NETWORK_ID: string
  WEB3_PROVIDER_URL: string
  WORMHOLE_ADDRESS: string | null
  WORMHOLE_RPC_HOSTS: string | null
}

const environment = process.env.VITE_ENVIRONMENT as Environment

let env: Env

switch (environment) {
  case 'development':
    env = envDev
    break
  case 'production':
    env = envProd
    break
  case 'staging':
    env = envStage
    break
  default:
    throw new Error(`Unknown environment: ${environment}`)
}

export { env }
