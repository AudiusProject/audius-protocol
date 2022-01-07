import { AccountInfo } from '@solana/spl-token'
import { PublicKey } from '@solana/web3.js'

import { Nullable } from 'common/utils/typeUtils'
import AudiusLibs from 'services/audius-backend/AudiusLibsLazyLoader'
import { waitForLibsInit } from 'services/audius-backend/eagerLoadUtils'

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
  await libs().solanaWeb3Manager.createUserBank()
}

export const createUserBankIfNeeded = async () => {
  await waitForLibsInit()
  try {
    const userbankExists = await doesUserBankExist()
    if (userbankExists) return
    console.warn(`Userbank doesn't exist, attempting to create...`)
    await createUserBank()
    console.log(`Successfully created userbank!`)
  } catch (err) {
    console.error(`Failed to create userbank, with err: ${err}`)
  }
}
