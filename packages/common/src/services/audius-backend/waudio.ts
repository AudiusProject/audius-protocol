import { AccountInfo } from '@solana/spl-token'
import { PublicKey } from '@solana/web3.js'

import { Nullable } from 'utils/typeUtils'

import { AnalyticsEvent, Name } from '../../models'

import { AudiusBackend } from './AudiusBackend'

export const deriveUserBank = async (audiusBackendInstance: AudiusBackend) => {
  const audiusLibs = await audiusBackendInstance.getAudiusLibs()
  return (await audiusLibs.solanaWeb3Manager.deriveUserBank()) as PublicKey
}

export const doesUserBankExist = async (
  audiusBackendInstance: AudiusBackend
) => {
  const audiusLibs = await audiusBackendInstance.getAudiusLibs()
  const userBank: PublicKey =
    await audiusLibs.solanaWeb3Manager.deriveUserBank()
  const doesExist = await checkIsCreatedTokenAccount(
    userBank.toString(),
    audiusBackendInstance
  )
  return doesExist
}

export const checkIsCreatedTokenAccount = async (
  addr: string,
  audiusBackendInstance: AudiusBackend
) => {
  const audiusLibs = await audiusBackendInstance.getAudiusLibs()
  const tokenAccount: Nullable<AccountInfo> =
    await audiusLibs.solanaWeb3Manager.getTokenAccountInfo(addr)
  return tokenAccount != null
}

export const createUserBank = async (
  feePayerOverride = null,
  audiusBackendInstance: AudiusBackend
) => {
  const audiusLibs = await audiusBackendInstance.getAudiusLibs()
  return audiusLibs.solanaWeb3Manager.createUserBank(feePayerOverride)
}

export const createUserBankIfNeeded = async (
  recordAnalytics: (event: AnalyticsEvent, callback?: () => void) => void,
  audiusBackendInstance: AudiusBackend,
  feePayerOverride = null
) => {
  const audiusLibs = await audiusBackendInstance.getAudiusLibs()
  const userId = audiusLibs.Account.getCurrentUser().user_id
  try {
    const userbankExists = await doesUserBankExist(audiusBackendInstance)
    if (userbankExists) return
    console.warn(`Userbank doesn't exist, attempting to create...`)
    await recordAnalytics({
      eventName: Name.CREATE_USER_BANK_REQUEST,
      properties: { userId }
    })
    const { error, errorCode } = await createUserBank(
      feePayerOverride,
      audiusBackendInstance
    )
    if (error || errorCode) {
      console.error(
        `Failed to create userbank, with err: ${error}, ${errorCode}`
      )
      await recordAnalytics({
        eventName: Name.CREATE_USER_BANK_FAILURE,
        properties: {
          userId,
          errorCode,
          error: (error as any).toString()
        }
      })
    } else {
      console.log(`Successfully created userbank!`)
      await recordAnalytics({
        eventName: Name.CREATE_USER_BANK_SUCCESS,
        properties: { userId }
      })
    }
  } catch (err) {
    await recordAnalytics({
      eventName: Name.CREATE_USER_BANK_FAILURE,
      properties: {
        userId,
        errorMessage: (err as any).toString()
      }
    })
    console.error(`Failed to create userbank, with err: ${err}`)
  }
}
