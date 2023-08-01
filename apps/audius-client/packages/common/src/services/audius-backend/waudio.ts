import type { AudiusLibs } from '@audius/sdk'

import { AnalyticsEvent, Name, SolanaWalletAddress } from '../../models'

import { AudiusBackend } from './AudiusBackend'

export const deriveUserBankPubkey = async (
  audiusBackendInstance: AudiusBackend,
  ethAddress?: string
) => {
  const audiusLibs: AudiusLibs = await audiusBackendInstance.getAudiusLibs()
  return await audiusLibs.solanaWeb3Manager!.deriveUserBank({ ethAddress })
}

export const deriveUserBankAddress = async (
  audiusBackendInstance: AudiusBackend,
  ethAddress?: string
) => {
  const pubkey = await deriveUserBankPubkey(audiusBackendInstance, ethAddress)
  return pubkey.toString() as SolanaWalletAddress
}

/**
 * Attempts to create a userbank.
 * Returns the userbank pubkey if it created or already existed; otherwise returns null if error.
 */
export const createUserBankIfNeeded = async (
  recordAnalytics: (event: AnalyticsEvent, callback?: () => void) => void,
  audiusBackendInstance: AudiusBackend,
  feePayerOverride: string,
  ethAddress?: string
) => {
  const audiusLibs: AudiusLibs = await audiusBackendInstance.getAudiusLibs()

  const recipientEthAddress =
    ethAddress ?? audiusLibs.Account!.getCurrentUser()?.wallet

  if (!recipientEthAddress) {
    console.error(
      "createUserBankIfNeeded: Unexpectedly couldn't get recipient eth address"
    )
    return null
  }

  try {
    const res = await audiusLibs.solanaWeb3Manager!.createUserBankIfNeeded({
      feePayerOverride,
      ethAddress
    })

    // If it already existed, return early
    if ('didExist' in res && res.didExist) {
      console.log('Userbank already exists')
      return res.userbank.toString() as SolanaWalletAddress
    }

    // Otherwise we must have tried to create one
    console.info(`Userbank doesn't exist, attempted to create...`)

    recordAnalytics({
      eventName: Name.CREATE_USER_BANK_REQUEST,
      properties: { recipientEthAddress }
    })

    // Handle error case
    if ('error' in res) {
      console.error(
        `Failed to create userbank, with err: ${res.error}, ${res.errorCode}`
      )
      recordAnalytics({
        eventName: Name.CREATE_USER_BANK_FAILURE,
        properties: {
          recipientEthAddress,
          errorCode: res.errorCode,
          error: (res.error as any).toString()
        }
      })
      return null
    }

    // Handle success case
    console.log(`Successfully created userbank!`)
    recordAnalytics({
      eventName: Name.CREATE_USER_BANK_SUCCESS,
      properties: { recipientEthAddress }
    })
    return res.userbank.toString() as SolanaWalletAddress
  } catch (err) {
    recordAnalytics({
      eventName: Name.CREATE_USER_BANK_FAILURE,
      properties: {
        recipientEthAddress,
        errorMessage: (err as any).toString()
      }
    })
    console.error(`Failed to create userbank, with err: ${err}`)
    return null
  }
}
