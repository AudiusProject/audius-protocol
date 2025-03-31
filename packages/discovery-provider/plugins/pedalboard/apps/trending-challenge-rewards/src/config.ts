import { audiusSdk } from './sdk'
import { AudiusSdk } from '@audius/sdk'
import dotenv from 'dotenv'

dotenv.config()

export type SharedData = {
  sdk: AudiusSdk
  runNow: boolean
  dryRun: boolean
  audiusDbUrl: string
  slackChannel?: string
  slackSigningSecret?: string
  slackBotToken?: string
  slackAppToken?: string
}

let sharedData: SharedData | undefined = undefined

export const initSharedData = async (): Promise<SharedData> => {
  if (sharedData !== undefined) return sharedData

  sharedData = {
    sdk: audiusSdk({
      environment: process.env.environment as
        | 'development'
        | 'staging'
        | 'production',
      discoveryNodeAllowlist:
        process.env.discovery_node_allowlist?.split(',') ?? undefined,
      solanaRelayNode: process.env.solana_relay_node!
    }),
    runNow: process.env.run_now?.toLowerCase() === 'true',
    dryRun: process.env.tcr_dry_run?.toLowerCase() === 'true',
    audiusDbUrl: process.env.audius_db_url!,
    slackChannel: process.env.slack_channel,
    slackSigningSecret: process.env.slack_signing_secret,
    slackBotToken: process.env.slack_bot_token,
    slackAppToken: process.env.slack_app_token
  }
  return sharedData
}
