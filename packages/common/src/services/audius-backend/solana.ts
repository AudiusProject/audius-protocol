import { AudiusLibs } from '@audius/sdk'
import { Account } from '@solana/spl-token'
import { PublicKey } from '@solana/web3.js'
import BN from 'bn.js'

import { AnalyticsEvent, Name, SolanaWalletAddress } from '../../models'

import { AudiusBackend } from './AudiusBackend'

const DEFAULT_RETRY_DELAY = 1000
const DEFAULT_MAX_RETRY_COUNT = 120

// TODO: Import from libs https://linear.app/audius/issue/PAY-1750/export-mintname-and-default-mint-from-libs
export type MintName = 'audio' | 'usdc'
export const DEFAULT_MINT: MintName = 'audio'

type UserBankConfig = {
  ethAddress?: string
  mint?: MintName
}

const delay = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms)
  })

export const getRootSolanaAccount = async (
  audiusBackendInstance: AudiusBackend
) => {
  const audiusLibs: AudiusLibs = await audiusBackendInstance.getAudiusLibs()
  return audiusLibs.solanaWeb3Manager!.solanaWeb3.Keypair.fromSeed(
    audiusLibs.Account!.hedgehog.wallet!.getPrivateKey()
  )
}

export const getCurrentUserWallet = async (
  audiusBackendInstance: AudiusBackend
) => {
  const audiusLibs = await audiusBackendInstance.getAudiusLibs()
  return await audiusLibs.Account!.getCurrentUser()?.wallet
}

export const getSolanaConnection = async (
  audiusBackendInstance: AudiusBackend
) => {
  return (await audiusBackendInstance.getAudiusLibs()).solanaWeb3Manager!
    .connection
}

export const getTokenAccountInfo = async (
  audiusBackendInstance: AudiusBackend,
  {
    mint = DEFAULT_MINT,
    tokenAccount
  }: {
    mint?: MintName
    tokenAccount: PublicKey
  }
): Promise<Account | null> => {
  return (
    await audiusBackendInstance.getAudiusLibs()
  ).solanaWeb3Manager!.getTokenAccountInfo(tokenAccount.toString(), mint)
}

export const deriveUserBankPubkey = async (
  audiusBackendInstance: AudiusBackend,
  { ethAddress, mint = DEFAULT_MINT }: UserBankConfig = {}
) => {
  const audiusLibs: AudiusLibs = await audiusBackendInstance.getAudiusLibs()
  return await audiusLibs.solanaWeb3Manager!.deriveUserBank({
    ethAddress,
    mint
  })
}

export const deriveUserBankAddress = async (
  audiusBackendInstance: AudiusBackend,
  { ethAddress, mint = DEFAULT_MINT }: UserBankConfig = {}
) => {
  const pubkey = await deriveUserBankPubkey(audiusBackendInstance, {
    ethAddress,
    mint
  })
  return pubkey.toString() as SolanaWalletAddress
}

type CreateUserBankIfNeededConfig = UserBankConfig & {
  recordAnalytics: (event: AnalyticsEvent, callback?: () => void) => void
  feePayerOverride: string
}

type CreateUserBankIfNeededErrorResult = {
  error: string
  errorCode: string | number | null
}
type CreateUserBankIfNeededSuccessResult = {
  didExist: boolean
  userbank: PublicKey
}
type CreateUserBankIfNeededResult =
  | CreateUserBankIfNeededSuccessResult
  | CreateUserBankIfNeededErrorResult

function isCreateUserBankIfNeededError(
  res: CreateUserBankIfNeededResult
): res is CreateUserBankIfNeededErrorResult {
  return 'error' in res
}

/**
 * Returns the userbank account info for the given address and mint. If the
 * userbank does not exist, returns null.
 */
export const getUserbankAccountInfo = async (
  audiusBackendInstance: AudiusBackend,
  { ethAddress: sourceEthAddress, mint = DEFAULT_MINT }: UserBankConfig = {}
): Promise<Account | null> => {
  const audiusLibs: AudiusLibs = await audiusBackendInstance.getAudiusLibs()
  const ethAddress =
    sourceEthAddress ?? audiusLibs.Account!.getCurrentUser()?.wallet

  if (!ethAddress) {
    throw new Error(
      `getUserbankAccountInfo: unexpected error getting eth address`
    )
  }

  const tokenAccount = await deriveUserBankPubkey(audiusBackendInstance, {
    ethAddress,
    mint
  })

  return getTokenAccountInfo(audiusBackendInstance, {
    tokenAccount,
    mint
  })
}

/**
 * Attempts to create a userbank if one does not exist.
 * Defaults to AUDIO mint and the current user's wallet.
 */
export const createUserBankIfNeeded = async (
  audiusBackendInstance: AudiusBackend,
  {
    recordAnalytics,
    feePayerOverride,
    mint = DEFAULT_MINT,
    ethAddress
  }: CreateUserBankIfNeededConfig
) => {
  const audiusLibs: AudiusLibs = await audiusBackendInstance.getAudiusLibs()

  const recipientEthAddress =
    ethAddress ?? audiusLibs.Account!.getCurrentUser()?.wallet

  if (!recipientEthAddress) {
    throw new Error(
      `createUserBankIfNeeded: Unexpectedly couldn't get recipient eth address`
    )
  }

  try {
    const res: CreateUserBankIfNeededResult =
      await audiusLibs.solanaWeb3Manager!.createUserBankIfNeeded({
        feePayerOverride,
        ethAddress: recipientEthAddress,
        mint
      })

    if (isCreateUserBankIfNeededError(res)) {
      // Will catch and log below
      throw res
    }

    // If it already existed, return early
    if (res.didExist) {
      console.debug('Userbank already exists')
    } else {
      // Otherwise we must have tried to create one
      console.info(`Userbank doesn't exist, attempted to create...`)

      recordAnalytics({
        eventName: Name.CREATE_USER_BANK_REQUEST,
        properties: { mint, recipientEthAddress }
      })
    }

    recordAnalytics({
      eventName: Name.CREATE_USER_BANK_SUCCESS,
      properties: { mint, recipientEthAddress }
    })
    return res.userbank
  } catch (err: any) {
    // Catching error here for analytics purposes
    const errorMessage = 'error' in err ? err.error : (err as any).toString()
    const errorCode = 'errorCode' in err ? err.errorCode : undefined
    recordAnalytics({
      eventName: Name.CREATE_USER_BANK_FAILURE,
      properties: {
        mint,
        recipientEthAddress,
        errorCode,
        errorMessage
      }
    })
    throw new Error(`Failed to create user bank: ${errorMessage}`)
  }
}

export const pollForBalanceChange = async (
  audiusBackendInstance: AudiusBackend,
  {
    tokenAccount,
    initialBalance,
    mint = DEFAULT_MINT,
    retryDelayMs = DEFAULT_RETRY_DELAY,
    maxRetryCount = DEFAULT_MAX_RETRY_COUNT
  }: {
    tokenAccount: PublicKey
    initialBalance?: bigint
    mint?: MintName
    retryDelayMs?: number
    maxRetryCount?: number
  }
) => {
  const debugTokenName = mint.toUpperCase()
  let retries = 0
  let tokenAccountInfo = await getTokenAccountInfo(audiusBackendInstance, {
    mint,
    tokenAccount
  })
  while (
    (!tokenAccountInfo ||
      initialBalance === undefined ||
      tokenAccountInfo.amount === initialBalance) &&
    retries++ < maxRetryCount
  ) {
    if (!tokenAccountInfo) {
      console.debug(
        `${debugTokenName} account not found. Retrying... ${retries}/${maxRetryCount}`
      )
    } else if (initialBalance === undefined) {
      initialBalance = tokenAccountInfo.amount
    } else if (tokenAccountInfo.amount === initialBalance) {
      console.debug(
        `Polling ${debugTokenName} balance (${initialBalance} === ${tokenAccountInfo.amount}) [${retries}/${maxRetryCount}]`
      )
    }
    await delay(retryDelayMs)
    tokenAccountInfo = await getTokenAccountInfo(audiusBackendInstance, {
      mint,
      tokenAccount
    })
  }
  if (
    tokenAccountInfo &&
    initialBalance &&
    tokenAccountInfo.amount !== initialBalance
  ) {
    console.debug(
      `${debugTokenName} balance changed by ${
        tokenAccountInfo.amount - initialBalance
      } (${initialBalance} => ${tokenAccountInfo.amount})`
    )
    return tokenAccountInfo.amount
  }
  throw new Error(`${debugTokenName} balance polling exceeded maximum retries`)
}

export type PurchaseContentArgs = {
  id: number
  blocknumber: number
  extraAmount?: number | BN
  type: 'track'
  splits: Record<string, number | BN>
}
export const purchaseContent = async (
  audiusBackendInstance: AudiusBackend,
  config: PurchaseContentArgs
) => {
  return (
    await audiusBackendInstance.getAudiusLibs()
  ).solanaWeb3Manager!.purchaseContent(config)
}
