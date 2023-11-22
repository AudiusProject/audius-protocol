import dotenv from 'dotenv'
import { cleanEnv, str, num, json } from 'envalid'
import { logger } from './logger'
import { Keypair } from '@solana/web3.js'

// reads .env file based on environment
const readDotEnv = () => {
  const environment = process.env.audius_discprov_env || 'dev'
  const dotenvConfig = (filename: string) =>
    dotenv.config({ path: `${filename}.env` })
  logger.info(`running on ${environment} network`)
  dotenvConfig(environment)
}

type FeePayerWallet = {
  privateKey: number[]
}

const readConfig = () => {
  readDotEnv()

  // validate env
  const env = cleanEnv(process.env, {
    audius_solana_endpoint: str({
      default: 'http://solana-test-validator:8899'
    }),
    audius_db_url: str({
      default:
        'postgresql+psycopg2://postgres:postgres@db:5432/discovery_provider_1'
    }),
    audius_solana_waudio_mint: str({ default: '' }),
    audius_solana_usdc_mint: str({ default: '' }),
    audius_solana_user_bank_program_address: str({ default: '' }),
    audius_solana_rewards_manager_program_address: str({ default: '' }),
    audius_solana_rewards_manager_account: str({ default: '' }),
    audius_solana_fee_payer_wallets: json<FeePayerWallet[]>({ default: [] }),
    solana_relay_server_host: str({ default: '0.0.0.0' }),
    solana_relay_server_port: num({ default: 6002 }),
    AUDIUS_REDIS_URL: str({ default: 'redis://identity-service-redis:6379/00' })
  })
  const solanaFeePayerWalletsParsed = env.audius_solana_fee_payer_wallets
  let solanaFeePayerWallets: Keypair[] = []
  if (Array.isArray(solanaFeePayerWalletsParsed)) {
    solanaFeePayerWallets = solanaFeePayerWalletsParsed.map((wallet) =>
      Keypair.fromSecretKey(Uint8Array.from(wallet.privateKey))
    )
  }
  return {
    discoveryDbConnectionString: env.audius_db_url,
    serverHost: env.solana_relay_server_host,
    serverPort: env.solana_relay_server_port,
    redisUrl: env.AUDIUS_REDIS_URL,
    solanaEndpoint: env.audius_solana_endpoint,
    rewardsManagerProgramId: env.audius_solana_rewards_manager_program_address,
    rewardsManagerAccountAddress: env.audius_solana_rewards_manager_account,
    claimableTokenProgramId: env.audius_solana_user_bank_program_address,
    usdcMintAddress: env.audius_solana_usdc_mint,
    waudioMintAddress: env.audius_solana_waudio_mint,
    solanaFeePayerWallets
  }
}

export const config = readConfig()
