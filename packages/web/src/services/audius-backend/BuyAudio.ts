import { MEMO_PROGRAM_ID } from '@audius/common/services'
import {
  TokenAccountNotFoundError,
  createTransferCheckedInstruction,
  getAccount,
  getAssociatedTokenAddress
} from '@solana/spl-token'
import {
  ComputeBudgetProgram,
  LAMPORTS_PER_SOL,
  PublicKey,
  Transaction,
  TransactionInstruction
} from '@solana/web3.js'

import { env } from 'services/env'
import { getSolanaConnection } from 'services/solana/solana'

import { audiusBackendInstance } from './audius-backend-instance'

const DEFAULT_RETRY_DELAY = 1000
const DEFAULT_MAX_RETRY_COUNT = 120

const ATA_SIZE = 165 // Size allocated for an associated token account

const delay = (ms: number) =>
  new Promise((resolve, reject) => {
    setTimeout(resolve, ms)
  })

// TODO: duplicated with similar fn in WithdrawUSDC.ts
export const getAssociatedTokenRentExemptionMinimum = async () => {
  const connection = await getSolanaConnection()
  return await connection.getMinimumBalanceForRentExemption(
    ATA_SIZE,
    'processed'
  )
}

export const getAssociatedTokenAccountInfo = async ({
  rootAccount,
  mintKey
}: {
  rootAccount: PublicKey
  mintKey: PublicKey
}) => {
  const connection = await getSolanaConnection()
  const associatedTokenAccountAddress = await getAssociatedTokenAddress(
    mintKey,
    rootAccount
  )
  try {
    return await getAccount(connection, associatedTokenAccountAddress)
  } catch (e) {
    if (e instanceof TokenAccountNotFoundError) {
      console.debug('No Token account exists for', mintKey.toString())
    } else {
      throw e
    }
    return null
  }
}

export const getAudioAccount = async ({
  rootAccount
}: {
  rootAccount: PublicKey
}) => {
  return audiusBackendInstance.findAssociatedTokenAddress({
    solanaWalletKey: rootAccount,
    mint: 'wAUDIO'
  })
}

export const getAudioAccountInfo = async ({
  tokenAccount
}: {
  tokenAccount: PublicKey
}) => {
  const connection = await getSolanaConnection()
  return await getAccount(connection, tokenAccount)
}

export const pollForAudioBalanceChange = async ({
  tokenAccount,
  initialBalance,
  retryDelayMs = DEFAULT_RETRY_DELAY,
  maxRetryCount = DEFAULT_MAX_RETRY_COUNT
}: {
  tokenAccount: PublicKey
  initialBalance: bigint
  retryDelayMs?: number
  maxRetryCount?: number
}) => {
  let retries = 0
  let tokenAccountInfo = await getAudioAccountInfo({ tokenAccount })
  while (
    (!tokenAccountInfo || tokenAccountInfo.amount === initialBalance) &&
    retries++ < maxRetryCount
  ) {
    if (!tokenAccountInfo) {
      console.debug(
        `AUDIO account not found. Retrying... ${retries}/${maxRetryCount}`
      )
    } else if (tokenAccountInfo.amount === initialBalance) {
      console.debug(
        `Polling AUDIO balance (${initialBalance} === ${tokenAccountInfo.amount}) [${retries}/${maxRetryCount}]`
      )
    }
    await delay(retryDelayMs)
    tokenAccountInfo = await getAudioAccountInfo({ tokenAccount })
  }
  if (tokenAccountInfo && tokenAccountInfo.amount !== initialBalance) {
    console.debug(
      `AUDIO balance changed by ${
        tokenAccountInfo.amount - initialBalance
      } (${initialBalance} => ${tokenAccountInfo.amount})`
    )
    return tokenAccountInfo.amount
  }
  throw new Error('AUDIO balance polling exceeded maximum retries')
}

export const pollForSolBalanceChange = async ({
  rootAccount,
  initialBalance,
  retryDelayMs = DEFAULT_RETRY_DELAY,
  maxRetryCount = DEFAULT_MAX_RETRY_COUNT
}: {
  rootAccount: PublicKey
  initialBalance?: number
  retryDelayMs?: number
  maxRetryCount?: number
}) => {
  const connection = await getSolanaConnection()
  let balance = await connection.getBalance(rootAccount, 'finalized')
  if (initialBalance === undefined) {
    initialBalance = balance
  }
  let retries = 0
  while (balance === initialBalance && retries++ < maxRetryCount) {
    console.debug(
      `Polling SOL balance (${initialBalance / LAMPORTS_PER_SOL} === ${
        balance / LAMPORTS_PER_SOL
      }) [${retries}/${maxRetryCount}]`
    )
    await delay(retryDelayMs)
    balance = await connection.getBalance(rootAccount, 'finalized')
  }
  if (balance !== initialBalance) {
    console.debug(
      `SOL balance changed by ${
        (balance - initialBalance) / LAMPORTS_PER_SOL
      } (${initialBalance / LAMPORTS_PER_SOL} => ${balance / LAMPORTS_PER_SOL})`
    )
    return balance
  }
  throw new Error('SOL balance polling exceeded maximum retries')
}

/**
 * Polls the given Solana wallet until the most recent transaction changes
 * and then returns the most recent transaction signature.
 *
 * NOTE: Will not return the next immediate transaction, just the new tip at the time the polling finds a new one.
 * In other words, if multiple transactions are added between polls, this method returns only the most recent one.
 */
export const pollForNewTransaction = async ({
  initialTransaction,
  rootAccount,
  retryDelayMs = DEFAULT_RETRY_DELAY,
  maxRetryCount = DEFAULT_MAX_RETRY_COUNT
}: {
  initialTransaction?: string
  rootAccount: PublicKey
  retryDelayMs?: number
  maxRetryCount?: number
}) => {
  const connection = await getSolanaConnection()
  const transactions = await connection.getSignaturesForAddress(rootAccount, {
    limit: 1
  })
  let transaction = transactions?.[0]?.signature
  let retries = 0
  while (transaction === initialTransaction && retries++ < maxRetryCount) {
    console.debug(
      `Polling wallet ${rootAccount.toString()} for new transaction.... [${retries}/${maxRetryCount}]`
    )
    await delay(retryDelayMs)
    const transactions = await connection.getSignaturesForAddress(rootAccount, {
      limit: 1
    })
    transaction = transactions?.[0]?.signature
  }
  if (transaction && transaction !== initialTransaction) {
    console.debug(`Found new transaction ${transaction}`)
    return transaction
  }
  throw new Error('Transaction polling exceeded maximum retries')
}

export const createTransferToUserBankTransaction = async ({
  userBank,
  fromAccount,
  amount,
  memo
}: {
  userBank: PublicKey
  fromAccount: PublicKey
  amount: bigint
  memo: string
}) => {
  const mintPublicKey = new PublicKey(env.WAUDIO_MINT_ADDRESS)
  const associatedTokenAccount = await getAudioAccount({
    rootAccount: fromAccount
  })
  // See: https://github.com/solana-labs/solana-program-library/blob/d6297495ea4dcc1bd48f3efdd6e3bbdaef25a495/memo/js/src/index.ts#L27
  const memoInstruction = new TransactionInstruction({
    keys: [
      {
        pubkey: fromAccount,
        isSigner: true,
        isWritable: true
      }
    ],
    programId: MEMO_PROGRAM_ID,
    data: Buffer.from(memo)
  })
  const transferInstruction = createTransferCheckedInstruction(
    associatedTokenAccount,
    mintPublicKey,
    userBank,
    fromAccount,
    amount,
    8
  )
  const tx = new Transaction()
  tx.add(memoInstruction)
  tx.add(transferInstruction)
  tx.add(
    ComputeBudgetProgram.setComputeUnitPrice({
      microLamports: 100000
    })
  )
  return tx
}
