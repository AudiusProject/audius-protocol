import { Name, Nullable } from '@audius/common'
import { AccountInfo } from '@solana/spl-token'
import { PublicKey } from '@solana/web3.js'

import { waitForLibsInit } from 'services/audius-backend/eagerLoadUtils'
import { track } from 'store/analytics/providers'

// @ts-ignore
const libs = () => window.audiusLibs

export const doesUserBankExist = async () => {
  await waitForLibsInit()
  const userBank: PublicKey = await libs().solanaWeb3Manager.getUserBank()
  const doesExist = await checkIsCreatedTokenAccount(userBank.toString())
  return doesExist
}

export const checkIsCreatedTokenAccount = async (addr: string) => {
  await waitForLibsInit()
  const tokenAccount: Nullable<AccountInfo> =
    await libs().solanaWeb3Manager.getAssociatedTokenAccountInfo(addr)
  return tokenAccount != null
}

export const createUserBank = async (feePayerOverride = null) => {
  await waitForLibsInit()
  return libs().solanaWeb3Manager.createUserBank(feePayerOverride)
}

export const createUserBankIfNeeded = async (feePayerOverride = null) => {
  await waitForLibsInit()
  const userId = libs().Account.getCurrentUser().user_id
  try {
    const userbankExists = await doesUserBankExist()
    if (userbankExists) return
    console.warn(`Userbank doesn't exist, attempting to create...`)
    await track(Name.CREATE_USER_BANK_REQUEST, { userId })
    const { error, errorCode } = await createUserBank(feePayerOverride)
    if (error || errorCode) {
      console.error(
        `Failed to create userbank, with err: ${error}, ${errorCode}`
      )
      await track(Name.CREATE_USER_BANK_FAILURE, {
        userId,
        errorCode,
        error: (error as any).toString()
      })
    } else {
      console.log(`Successfully created userbank!`)
      await track(Name.CREATE_USER_BANK_SUCCESS, { userId })
    }
  } catch (err) {
    await track(Name.CREATE_USER_BANK_FAILURE, {
      userId,
      errorMessage: (err as any).toString()
    })
    console.error(`Failed to create userbank, with err: ${err}`)
  }
}
