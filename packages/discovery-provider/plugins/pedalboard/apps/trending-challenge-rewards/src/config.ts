import { AudiusLibs } from '@audius/sdk'
import { App } from '@pedalboard/basekit'
import moment from 'moment'
import dotenv from 'dotenv'
import { initAudiusLibs } from './libs'
import { Err, Ok, Result } from 'ts-results'

export type SharedData = {
  oracleEthAddress: string
  AAOEndpoint: string
  feePayerOverride: string
  libs: AudiusLibs
  localEndpoint: string
  dryRun: boolean
}

let sharedData: SharedData | undefined = undefined

export const initSharedData = async (): Promise<SharedData> => {
  if (sharedData !== undefined) return sharedData

  const libs = await initAudiusLibs()

  // default to true if undefined, otherwise explicitly state false to not do dry run
  const dryRun = !(
    (process.env.tcrDryRun || 'true').toLocaleLowerCase() === 'false'
  )

  const feePayerOverride = process.env.audius_fee_payer_override
  const AAOEndpoint = process.env.audius_aao_endpoint || "https://antiabuseoracle.audius.co"
  const oracleEthAddress = process.env.audius_aao_address || "0x9811BA3eAB1F2Cd9A2dFeDB19e8c2a69729DC8b6"
  const localEndpoint = process.env.audius_discprov_url || "http://server:5000"

  if (feePayerOverride === undefined)
    throw new Error('feePayerOverride undefined')

  sharedData = {
    oracleEthAddress,
    AAOEndpoint,
    feePayerOverride,
    libs,
    localEndpoint,
    dryRun
  }
  // @ts-ignore
  return sharedData
}
