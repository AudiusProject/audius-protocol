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

  const oracleEthAddress = process.env.tcrOracleEthAddress
  const AAOEndpoint = process.env.tcrAAOEndpoint
  const feePayerOverride = process.env.tcrFeePayerOverride
  const localEndpoint = process.env.tcrLocalEndpoint

  const dateToRun = process.env.dateToRun

  if (oracleEthAddress === undefined)
    throw new Error('oracleEthAddress undefined')
  if (AAOEndpoint === undefined) throw new Error('AAOEndpoint undefined')
  if (feePayerOverride === undefined)
    throw new Error('feePayerOverride undefined')
  if (localEndpoint === undefined) throw new Error('localEndpoint undefined')

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
