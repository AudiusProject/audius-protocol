import { Keypair, PublicKey } from '@solana/web3.js'
import dotenv from 'dotenv'
import { cleanEnv, str, num, json } from 'envalid'

import { logger } from './logger'

export const ClockProgram = new PublicKey(
  'SysvarC1ock11111111111111111111111111111111'
)
export const InstructionsProgram = new PublicKey(
  'Sysvar1nstructions1111111111111111111111111'
)

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

type Config = {
  endpoint: string
  discoveryDbConnectionString: string
  redisUrl: string
  serverHost: string
  serverPort: number
  solanaEndpoints: string[]
  rewardsManagerProgramId: string
  rewardsManagerAccountAddress: string
  claimableTokenProgramId: string
  paymentRouterProgramId: string
  trackListenCountProgramId: string
  ethRegistryProgramId: string
  usdcMintAddress: string
  waudioMintAddress: string
  solanaFeePayerWallets: Keypair[]
  delegatePrivateKey: Buffer
  ipdataApiKey: string | null
  listensValidSigner: string
  solanaSignerPrivateKey: string
}

let cachedConfig: Config | null = null

const readConfig = (): Config => {
  if (cachedConfig !== null) return cachedConfig
  readDotEnv()

  // validate env
  const env = cleanEnv(process.env, {
    audius_discprov_url: str({
      default: 'http://audius-protocol-discovery-provider-1'
    }),
    audius_db_url: str({
      default:
        'postgresql+psycopg2://postgres:postgres@db:5432/discovery_provider_1'
    }),
    audius_redis_url: str({
      default: 'redis://audius-protocol-discovery-provider-redis-1:6379/00'
    }),
    audius_solana_endpoint: str({
      default: 'http://solana-test-validator:8899'
    }),
    audius_solana_track_listen_count_address: str({
      default: 'testEjzEibm3nq77VQcqCCmSMx6m3KdJHuepBH1rnue'
    }),
    audius_solana_waudio_mint: str({
      default: '37RCjhgV1qGV2Q54EHFScdxZ22ydRMdKMtVgod47fDP3'
    }),
    audius_solana_usdc_mint: str({
      default: '26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y'
    }),
    audius_solana_user_bank_program_address: str({
      default: 'testHKV1B56fbvop4w6f2cTGEub9dRQ2Euta5VmqdX9'
    }),
    audius_solana_payment_router_program_address: str({
      default: 'apaySbqV1XAmuiGszeN4NyWrXkkMrnuJVoNhzmS1AMa'
    }),
    audius_solana_rewards_manager_program_address: str({
      default: 'testLsJKtyABc9UXJF8JWFKf1YH4LmqCWBC42c6akPb'
    }),
    audius_solana_rewards_manager_account: str({
      default: 'DJPzVothq58SmkpRb1ATn5ddN2Rpv1j2TcGvM3XsHf1c'
    }),
    audius_solana_fee_payer_wallets: json<FeePayerWallet[]>({
      default: [
        {
          privateKey: [
            170, 161, 84, 122, 118, 210, 128, 213, 96, 185, 143, 218, 54, 254,
            217, 204, 157, 175, 137, 71, 202, 108, 51, 242, 21, 50, 56, 77, 54,
            116, 103, 56, 251, 64, 77, 100, 199, 88, 103, 189, 42, 163, 67, 251,
            101, 204, 7, 59, 70, 109, 113, 50, 209, 154, 55, 164, 227, 108, 203,
            146, 121, 148, 85, 119
          ]
        }
      ]
    }),
    solana_relay_server_host: str({ default: '0.0.0.0' }),
    solana_relay_server_port: num({ default: 6002 }),
    audius_delegate_private_key: str({ default: '' }),
    audius_ipdata_api_key: str({
      // Throwaway test key
      default: '01b633611c0b57babd56a6fdf7400b21340956e1840da6dd788f9c37'
    }),
    audius_solana_eth_registry_program: str({
      default: 'testBgRfFcage1hN7zmTsktdQCJZkHEhM1eguYPaeKg'
    }),
    audius_solana_listens_valid_signer: str({
      default: 'yM9adjwKaRbYxQzLPF6zvZMSAfKUNte5xvK4B3iGbkL'
    }),
    audius_solana_signer_private_key: str({
      default:
        'd242765e718801781440d77572b9dafcdc9baadf0269eff24cf61510ddbf1003'
    })
  })
  const solanaFeePayerWalletsParsed = env.audius_solana_fee_payer_wallets
  let solanaFeePayerWallets: Keypair[] = []
  if (Array.isArray(solanaFeePayerWalletsParsed)) {
    solanaFeePayerWallets = solanaFeePayerWalletsParsed.map((wallet) =>
      Keypair.fromSecretKey(Uint8Array.from(wallet.privateKey))
    )
  }
  const delegatePrivateKey: Buffer = env.audius_delegate_private_key
    ? Buffer.from(env.audius_delegate_private_key, 'hex')
    : Buffer.from([])

  cachedConfig = {
    endpoint: env.audius_discprov_url,
    discoveryDbConnectionString: env.audius_db_url,
    redisUrl: env.audius_redis_url,
    serverHost: env.solana_relay_server_host,
    serverPort: env.solana_relay_server_port,
    solanaEndpoints: env.audius_solana_endpoint.split(','),
    rewardsManagerProgramId: env.audius_solana_rewards_manager_program_address,
    rewardsManagerAccountAddress: env.audius_solana_rewards_manager_account,
    claimableTokenProgramId: env.audius_solana_user_bank_program_address,
    paymentRouterProgramId: env.audius_solana_payment_router_program_address,
    trackListenCountProgramId: env.audius_solana_track_listen_count_address,
    usdcMintAddress: env.audius_solana_usdc_mint,
    waudioMintAddress: env.audius_solana_waudio_mint,
    solanaFeePayerWallets,
    delegatePrivateKey,
    ipdataApiKey:
      env.audius_ipdata_api_key === '' ? null : env.audius_ipdata_api_key,
    listensValidSigner: env.audius_solana_listens_valid_signer,
    ethRegistryProgramId: env.audius_solana_eth_registry_program,
    solanaSignerPrivateKey: env.audius_solana_signer_private_key
  }
  return readConfig()
}

export const config = readConfig()
