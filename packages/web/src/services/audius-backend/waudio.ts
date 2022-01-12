import { AccountInfo } from '@solana/spl-token'
import { PublicKey } from '@solana/web3.js'

import { FeatureFlags } from 'common/services/remote-config'
import { Nullable } from 'common/utils/typeUtils'
import { waitForLibsInit } from 'services/audius-backend/eagerLoadUtils'
import { remoteConfigInstance } from 'services/remote-config/remote-config-instance'

// @ts-ignore
const libs = () => window.audiusLibs

export const doesUserBankExist = async () => {
  await waitForLibsInit()
  const userBank: PublicKey = await libs().solanaWeb3Manager.getUserBank()
  const tokenAccount: Nullable<AccountInfo> = await libs().solanaWeb3Manager.getAssociatedTokenAccountInfo(
    userBank.toString()
  )
  return tokenAccount != null
}

export const createUserBank = async () => {
  await waitForLibsInit()
  return libs().solanaWeb3Manager.createUserBank()
}

export const createUserBankIfNeeded = async () => {
  await waitForLibsInit()
  const userbankEnabled = remoteConfigInstance.getFeatureEnabled(
    FeatureFlags.CREATE_WAUDIO_USER_BANK_ON_SIGN_UP
  )
  if (!userbankEnabled) return
  try {
    const userbankExists = await doesUserBankExist()
    if (userbankExists) return
    console.warn(`Userbank doesn't exist, attempting to create...`)
    const { error, errorCode } = await createUserBank()
    if (error || errorCode) {
      console.error(
        `Failed to create userbank, with err: ${error}, ${errorCode}`
      )
    } else {
      console.log(`Successfully created userbank!`)
    }
  } catch (err) {
    console.error(`Failed to create userbank, with err: ${err}`)
  }
}
