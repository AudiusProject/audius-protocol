import {
  AccountInfo,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  Token,
  TOKEN_PROGRAM_ID,
  u64
} from '@solana/spl-token'
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  Transaction,
  TransactionInstruction
} from '@solana/web3.js'

import { waitForLibsInit } from 'services/audius-backend/eagerLoadUtils'
// @ts-ignore
const libs = () => window.audiusLibs

const TOKEN_ACCOUNT_POLL_MS = 5000
const MAX_TOKEN_ACCOUNT_POLL_COUNT = 20

const SOL_ACCOUNT_POLL_MS = 5000
const MAX_SOL_ACCOUNT_POLL_COUNT = 20

const ROOT_ACCOUNT_SIZE = 0 // Root account takes 0 bytes, but still pays rent!
const ATA_SIZE = 165 // Size allocated for an associated token account

const MEMO_PROGRAM_ID = new PublicKey(
  'Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo'
)

const delay = (ms: number) =>
  new Promise((resolve, reject) => {
    setTimeout(resolve, ms)
  })

export const getRootSolanaAccount = async () => {
  await waitForLibsInit()
  return libs().solanaWeb3Manager.solanaWeb3.Keypair.fromSeed(
    libs().Account.hedgehog.wallet.getPrivateKey()
  ) as Keypair
}

export const getSolanaConnection = async () => {
  await waitForLibsInit()
  return libs().solanaWeb3Manager.connection as Connection
}

export const getRootAccountRentExemptionMinimum = async () => {
  await waitForLibsInit()
  const connection = await getSolanaConnection()
  return await connection.getMinimumBalanceForRentExemption(
    ROOT_ACCOUNT_SIZE,
    'processed'
  )
}

export const getAssociatedTokenRentExemptionMinimum = async () => {
  await waitForLibsInit()
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
  await waitForLibsInit()
  const connection = await getSolanaConnection()
  const [associatedTokenAccountAddress] = await PublicKey.findProgramAddress(
    [rootAccount.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mintKey.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID
  )
  const associatedToken = new Token(
    connection,
    mintKey,
    TOKEN_PROGRAM_ID,
    Keypair.generate()
  )
  try {
    return await associatedToken.getAccountInfo(associatedTokenAccountAddress)
  } catch (e) {
    if ((e as any).message === 'Failed to find account') {
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
  await waitForLibsInit()
  return (await libs().solanaWeb3Manager.findAssociatedTokenAddress(
    rootAccount.toString()
  )) as PublicKey
}

export const getAudioAccountInfo = async ({
  tokenAccount
}: {
  tokenAccount: PublicKey
}) => {
  await waitForLibsInit()
  const tokenAccountInfo: AccountInfo | null =
    await libs().solanaWeb3Manager.getTokenAccountInfo(tokenAccount.toString())
  return tokenAccountInfo
}

export const pollForAudioBalanceChange = async ({
  tokenAccount,
  initialBalance
}: {
  tokenAccount: PublicKey
  initialBalance?: u64
}) => {
  let retries = 0
  let tokenAccountInfo = await getAudioAccountInfo({ tokenAccount })
  while (
    (!tokenAccountInfo ||
      initialBalance === undefined ||
      tokenAccountInfo.amount.eq(initialBalance)) &&
    retries++ <= MAX_TOKEN_ACCOUNT_POLL_COUNT
  ) {
    if (!tokenAccountInfo) {
      console.debug(
        `AUDIO account not found. Retrying... ${retries}/${MAX_TOKEN_ACCOUNT_POLL_COUNT}`
      )
    } else if (initialBalance === undefined) {
      initialBalance = tokenAccountInfo.amount
    } else if (tokenAccountInfo.amount.eq(initialBalance)) {
      console.debug(
        `Polling AUDIO balance (${initialBalance} === ${tokenAccountInfo.amount}) [${retries}/${MAX_TOKEN_ACCOUNT_POLL_COUNT}]`
      )
    }
    await delay(TOKEN_ACCOUNT_POLL_MS)
    tokenAccountInfo = await getAudioAccountInfo({ tokenAccount })
  }
  if (
    tokenAccountInfo &&
    initialBalance &&
    !tokenAccountInfo.amount.eq(initialBalance)
  ) {
    console.debug(
      `AUDIO balance changed by ${tokenAccountInfo.amount.sub(
        initialBalance
      )} (${initialBalance} => ${tokenAccountInfo.amount})`
    )
    return tokenAccountInfo.amount
  }
  throw new Error('AUDIO balance polling exceeded maximum retries')
}

export const pollForSolBalanceChange = async ({
  rootAccount,
  initialBalance
}: {
  rootAccount: PublicKey
  initialBalance?: number
}) => {
  const connection = await getSolanaConnection()
  let balance = await connection.getBalance(rootAccount, 'finalized')
  if (initialBalance === undefined) {
    initialBalance = balance
  }
  let retries = 0
  while (
    balance === initialBalance &&
    retries++ <= MAX_SOL_ACCOUNT_POLL_COUNT
  ) {
    console.debug(
      `Polling SOL balance (${initialBalance / LAMPORTS_PER_SOL} === ${
        balance / LAMPORTS_PER_SOL
      }) [${retries}/${MAX_SOL_ACCOUNT_POLL_COUNT}]`
    )
    await delay(SOL_ACCOUNT_POLL_MS)
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

export const createTransferToUserBankTransaction = async ({
  userBank,
  fromAccount,
  amount,
  memo
}: {
  userBank: PublicKey
  fromAccount: PublicKey
  amount: u64
  memo: string
}) => {
  await waitForLibsInit()
  const mintPublicKey = new PublicKey(libs().solanaWeb3Config.mintAddress)
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
  const transferInstruction = Token.createTransferCheckedInstruction(
    TOKEN_PROGRAM_ID,
    associatedTokenAccount,
    mintPublicKey,
    userBank,
    fromAccount,
    [],
    amount,
    8
  )
  const tx = new Transaction()
  tx.add(memoInstruction)
  tx.add(transferInstruction)
  return tx
}
