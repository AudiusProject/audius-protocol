import { AudiusSdk } from '@audius/sdk'
import { AudiusLibs } from '@audius/sdk-legacy/dist/libs'
import { u8 } from '@solana/buffer-layout'
import {
  Account,
  TOKEN_PROGRAM_ID,
  TokenInstruction,
  createAssociatedTokenAccountIdempotentInstruction,
  createTransferCheckedInstruction,
  decodeTransferCheckedInstruction,
  getAccount,
  getAssociatedTokenAddressSync
} from '@solana/spl-token'
import {
  AddressLookupTableAccount,
  Commitment,
  ComputeBudgetProgram,
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction
} from '@solana/web3.js'
import BN from 'bn.js'

import { CommonStoreContext } from '~/store/storeContext'

import {
  AnalyticsEvent,
  Name,
  SolanaWalletAddress,
  PurchaseAccess
} from '../../models'

import { AudiusBackend } from './AudiusBackend'

const DEFAULT_RETRY_DELAY = 1000
const DEFAULT_MAX_RETRY_COUNT = 120
const PLACEHOLDER_SIGNATURE = new Array(64).fill(0)
export const RECOVERY_MEMO_STRING = 'Recover Withdrawal'
export const WITHDRAWAL_MEMO_STRING = 'Withdrawal'
export const PREPARE_WITHDRAWAL_MEMO_STRING = 'Prepare Withdrawal'

/**
 * Memo program V1
 * https://github.com/solana-labs/solana-program-library/blob/7492e38b8577eef4defb5d02caadf82162887c68/memo/program/src/lib.rs#L16-L21
 */
export const MEMO_PROGRAM_ID = new PublicKey(
  'Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo'
)

const MINT_DECIMALS: Record<MintName, number> = {
  audio: 8,
  usdc: 6
}

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

/**
 * Gets a Solana wallet derived from the user's Hedgehog wallet
 */
export const getRootSolanaAccount = async (
  audiusBackendInstance: AudiusBackend
) => {
  const audiusLibs: AudiusLibs = await audiusBackendInstance.getAudiusLibs()
  return audiusLibs.solanaWeb3Manager!.solanaWeb3.Keypair.fromSeed(
    audiusLibs.Account!.hedgehog.wallet!.getPrivateKey()
  )
}

/**
 * Gets the Solana connection libs is currently using
 */
export const getSolanaConnection = async (
  audiusBackendInstance: AudiusBackend
) => {
  return (
    await audiusBackendInstance.getAudiusLibsTyped()
  ).solanaWeb3Manager!.getConnection()
}

/**
 * Gets the latest blockhash using the libs connection
 */
export const getRecentBlockhash = async (
  audiusBackendInstance: AudiusBackend
) => {
  const connection = await getSolanaConnection(audiusBackendInstance)
  return (await connection.getLatestBlockhash()).blockhash
}

/**
 * Gets the token account information for a given address and Audius-relevant mint
 */
export const getTokenAccountInfo = async (
  audiusBackendInstance: AudiusBackend,
  {
    tokenAccount,
    commitment = 'processed'
  }: {
    tokenAccount: PublicKey
    commitment?: Commitment
  }
): Promise<Account | null> => {
  return (
    await audiusBackendInstance.getAudiusLibs()
  ).solanaWeb3Manager!.getTokenAccountInfo(tokenAccount.toString(), commitment)
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

export const isTransferCheckedInstruction = (
  instruction: TransactionInstruction
) => {
  return (
    instruction.programId.equals(TOKEN_PROGRAM_ID) &&
    instruction.data.length &&
    u8().decode(instruction.data) === TokenInstruction.TransferChecked
  )
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
  { ethAddress: sourceEthAddress, mint = DEFAULT_MINT }: UserBankConfig = {},
  commitment?: Commitment
): Promise<Account | null> => {
  const libs: AudiusLibs = await audiusBackendInstance.getAudiusLibsTyped()

  const ethAddress = sourceEthAddress ?? libs.getCurrentUser().wallet
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
    mint,
    commitment
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

  const recipientEthAddress = ethAddress ?? audiusLibs.getCurrentUser().wallet

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
        eventName: Name.CREATE_USER_BANK_SUCCESS,
        properties: { mint, recipientEthAddress }
      })
    }
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

/**
 * Polls the given token account until its balance is different from initial balance or a timeoout.
 * @throws an error if the balance doesn't change within the timeout.
 */
export const pollForTokenBalanceChange = async (
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
    initialBalance !== undefined &&
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

/**
 * Polls the given wallet until its SOL balance is different from initial balance or a timeoout.
 * @throws an error if the balance doesn't change within the timeout.
 */
export const pollForBalanceChange = async (
  audiusBackendInstance: AudiusBackend,
  {
    wallet,
    initialBalance,
    retryDelayMs = DEFAULT_RETRY_DELAY,
    maxRetryCount = DEFAULT_MAX_RETRY_COUNT
  }: {
    wallet: PublicKey
    initialBalance?: bigint
    retryDelayMs?: number
    maxRetryCount?: number
  }
) => {
  console.info(`Polling SOL balance for ${wallet.toBase58()} ...`)
  let balanceBN = await audiusBackendInstance.getAddressSolBalance(
    wallet.toBase58()
  )
  let balance = BigInt(balanceBN.toString())
  if (initialBalance === undefined) {
    initialBalance = balance
  }
  let retries = 0
  while (balance === initialBalance && retries++ < maxRetryCount) {
    console.debug(
      `Polling SOL balance (${initialBalance} === ${balance}) [${retries}/${maxRetryCount}]`
    )
    await delay(retryDelayMs)
    balanceBN = await audiusBackendInstance.getAddressSolBalance(
      wallet.toBase58()
    )
    balance = BigInt(balanceBN.toString())
  }
  if (balance !== initialBalance) {
    console.debug(
      `SOL balance changed by ${
        balance - initialBalance
      } (${initialBalance} => ${balance})`
    )
    return balance
  }
  throw new Error('SOL balance polling exceeded maximum retries')
}

export const findAssociatedTokenAddress = async (
  audiusBackendInstance: AudiusBackend,
  { solanaAddress, mint }: { solanaAddress: string; mint: MintName }
) => {
  return (
    await audiusBackendInstance.getAudiusLibsTyped()
  ).solanaWeb3Manager!.findAssociatedTokenAddress(solanaAddress, mint)
}

/** Converts a Coinflow transaction which transfers directly from root wallet USDC
 * account into a transaction that routes through the current user's USDC user bank, to
 * better facilitate indexing. The original transaction *must* use a TransferChecked instruction
 * and must have the current user's Solana root wallet USDC token account as the source.
 * @returns a new transaction that routes the USDC transfer through the user bank. This must be signed
 * by the current user's Solana root wallet and the provided fee payer (likely via relay).
 */
export const decorateCoinflowWithdrawalTransaction = async (
  audiusBackendInstance: AudiusBackend,
  { transaction, feePayer }: { transaction: Transaction; feePayer: PublicKey }
) => {
  const libs = await audiusBackendInstance.getAudiusLibsTyped()
  const solanaWeb3Manager = libs.solanaWeb3Manager!

  const userBank = await deriveUserBankPubkey(audiusBackendInstance, {
    mint: 'usdc'
  })
  const wallet = await getRootSolanaAccount(audiusBackendInstance)
  const walletUSDCTokenAccount =
    await solanaWeb3Manager.findAssociatedTokenAddress(
      wallet.publicKey.toBase58(),
      'usdc'
    )

  // Filter any compute budget instructions since the budget will
  // definitely change
  const instructions = transaction.instructions.filter(
    (instruction) =>
      !instruction.programId.equals(ComputeBudgetProgram.programId)
  )

  // Find original transfer instruction and index
  const transferInstructionIndex = instructions.findIndex(
    isTransferCheckedInstruction
  )
  const transferInstruction = instructions[transferInstructionIndex]
  if (!transferInstruction) {
    throw new Error('No transfer instruction found')
  }

  const { keys, data } = decodeTransferCheckedInstruction(
    transferInstruction,
    TOKEN_PROGRAM_ID
  )
  if (!walletUSDCTokenAccount.equals(keys.source.pubkey)) {
    throw new Error(
      `Original sender ${keys.source.pubkey} does not match wallet ${walletUSDCTokenAccount}`
    )
  }

  const transferToUserBankInstruction = createTransferCheckedInstruction(
    walletUSDCTokenAccount,
    keys.mint.pubkey,
    userBank,
    wallet.publicKey,
    data.amount,
    data.decimals
  )

  const transferFromUserBankInstructions =
    await solanaWeb3Manager.createTransferInstructionsFromCurrentUser({
      amount: new BN(data.amount.toString()),
      mint: 'usdc',
      senderSolanaAddress: userBank,
      recipientSolanaAddress: keys.destination.pubkey.toBase58(),
      instructionIndex: transferInstructionIndex + 1,
      feePayerKey: feePayer
    })

  const withdrawalMemoInstruction = new TransactionInstruction({
    keys: [
      {
        pubkey: wallet.publicKey,
        isSigner: true,
        isWritable: true
      }
    ],
    programId: MEMO_PROGRAM_ID,
    data: Buffer.from(WITHDRAWAL_MEMO_STRING)
  })

  // Remove original transfer instruction and replace with our set of transfer steps
  instructions.splice(
    transferInstructionIndex,
    1,
    transferToUserBankInstruction,
    ...transferFromUserBankInstructions,
    withdrawalMemoInstruction
  )

  const { blockhash, lastValidBlockHeight } = await solanaWeb3Manager
    .getConnection()
    .getLatestBlockhash()
  const modifiedTransaction = new Transaction({
    blockhash,
    feePayer,
    lastValidBlockHeight
  })
  modifiedTransaction.add(...instructions)

  return modifiedTransaction
}

export const createTransferToUserBankTransaction = async (
  audiusBackendInstance: AudiusBackend,
  {
    userBank,
    wallet,
    amount,
    memo,
    mint = 'audio',
    recentBlockhash,
    feePayer
  }: {
    userBank: PublicKey
    wallet: Keypair
    amount: bigint
    memo: string
    mint?: MintName
    feePayer?: PublicKey
    recentBlockhash?: string
  }
) => {
  const libs = await audiusBackendInstance.getAudiusLibsTyped()
  const mintPublicKey = libs.solanaWeb3Manager!.mints[mint]
  const associatedTokenAccount = await findAssociatedTokenAddress(
    audiusBackendInstance,
    {
      solanaAddress: wallet.publicKey.toBase58(),
      mint
    }
  )
  // See: https://github.com/solana-labs/solana-program-library/blob/d6297495ea4dcc1bd48f3efdd6e3bbdaef25a495/memo/js/src/index.ts#L27
  const memoInstruction = new TransactionInstruction({
    keys: [
      {
        pubkey: wallet.publicKey,
        isSigner: true,
        isWritable: true
      }
    ],
    programId: MEMO_PROGRAM_ID,
    data: Buffer.from(memo)
  })
  const transferInstruction = createTransferCheckedInstruction(
    associatedTokenAccount, // source
    mintPublicKey, // mint
    userBank, // destination
    wallet.publicKey, // owner
    amount, // amount
    MINT_DECIMALS[mint] // decimals
  )
  const tx = new Transaction({ recentBlockhash, feePayer })
  tx.add(memoInstruction)
  tx.add(transferInstruction)
  return tx
}

/**
 * A pared down version of {@link purchaseContentWithPaymentRouter}
 * that doesn't add the purchase memo.
 */
export const createPaymentRouterRouteTransaction = async (
  audiusBackendInstance: AudiusBackend,
  {
    sender,
    splits
  }: {
    sender: PublicKey
    splits: Record<string, number | BN>
  }
) => {
  const solanaWeb3Manager = (await audiusBackendInstance.getAudiusLibsTyped())
    .solanaWeb3Manager!
  const { blockhash } = await solanaWeb3Manager
    .getConnection()
    .getLatestBlockhash()
  const [transfer, route] =
    // All the memo related parameters are ignored
    await solanaWeb3Manager.getPurchaseContentWithPaymentRouterInstructions({
      id: 0, // ignored
      type: 'track', // ignored
      blocknumber: 0, // ignored
      splits,
      purchaserUserId: 0, // ignored
      senderAccount: sender,
      purchaseAccess: PurchaseAccess.STREAM // ignored
    })
  return new Transaction({
    recentBlockhash: blockhash,
    feePayer: sender
  }).add(transfer, route)
}

/**
 * Relays the given transaction using the libs transaction handler
 */
export const relayTransaction = async (
  audiusBackendInstance: AudiusBackend,
  {
    transaction,
    skipPreflight,
    useCoinflowRelay
  }: {
    transaction: Transaction
    skipPreflight?: boolean
    useCoinflowRelay?: boolean
  }
) => {
  const libs = await audiusBackendInstance.getAudiusLibsTyped()
  const instructions = transaction.instructions
  const signatures = transaction.signatures
    .filter((s) => s.signature !== null)
    .map((s) => ({
      signature: s.signature!, // safe from filter
      publicKey: s.publicKey.toString()
    }))
  const feePayerOverride = transaction.feePayer
  const recentBlockhash = transaction.recentBlockhash
  return await libs.solanaWeb3Manager!.transactionHandler.handleTransaction({
    instructions,
    recentBlockhash,
    signatures,
    feePayerOverride,
    skipPreflight,
    useCoinflowRelay
  })
}

/**
 * Relays the given versioned transaction using the libs transaction handler
 */
export const relayVersionedTransaction = async (
  audiusBackendInstance: AudiusBackend,
  {
    transaction,
    addressLookupTableAccounts,
    skipPreflight
  }: {
    transaction: VersionedTransaction
    addressLookupTableAccounts: AddressLookupTableAccount[]
    skipPreflight?: boolean
  }
) => {
  const placeholderSignature = Buffer.from(PLACEHOLDER_SIGNATURE)
  const libs = await audiusBackendInstance.getAudiusLibsTyped()
  const decompiledMessage = TransactionMessage.decompile(transaction.message, {
    addressLookupTableAccounts
  })
  const signatures = transaction.message.staticAccountKeys
    .slice(0, transaction.message.header.numRequiredSignatures)
    .map((publicKey, index) => ({
      publicKey: publicKey.toBase58(),
      signature: Buffer.from(transaction.signatures[index])
    }))
    .filter((meta) => !meta.signature.equals(placeholderSignature))
  return await libs.solanaWeb3Manager!.transactionHandler.handleTransaction({
    instructions: decompiledMessage.instructions,
    recentBlockhash: decompiledMessage.recentBlockhash,
    signatures,
    feePayerOverride: decompiledMessage.payerKey,
    lookupTableAddresses: addressLookupTableAccounts.map((lut) =>
      lut.key.toBase58()
    ),
    skipPreflight
  })
}

/**
 * Helper that gets the lookup table accounts (that is, the account holding the lookup table,
 * not the accounts _in_ the lookup table) from their addresses.
 */
export const getLookupTableAccounts = async (
  audiusBackendInstance: AudiusBackend,
  { lookupTableAddresses }: { lookupTableAddresses: string[] }
) => {
  const libs = await audiusBackendInstance.getAudiusLibsTyped()
  const connection = libs.solanaWeb3Manager!.getConnection()
  return await Promise.all(
    lookupTableAddresses.map(async (address) => {
      const account = await connection.getAddressLookupTable(
        new PublicKey(address)
      )
      if (account.value == null) {
        throw new Error(`Couldn't find lookup table ${address}`)
      }
      return account.value
    })
  )
}

/**
 * Helper to create a versioned transaction with lookup tables
 */
export const createVersionedTransaction = async (
  audiusBackendInstance: AudiusBackend,
  {
    instructions,
    lookupTableAddresses,
    feePayer
  }: {
    instructions: TransactionInstruction[]
    lookupTableAddresses: string[]
    feePayer: PublicKey
  }
) => {
  const addressLookupTableAccounts = await getLookupTableAccounts(
    audiusBackendInstance,
    { lookupTableAddresses }
  )
  const recentBlockhash = await getRecentBlockhash(audiusBackendInstance)

  const message = new TransactionMessage({
    payerKey: feePayer,
    recentBlockhash,
    instructions
  }).compileToV0Message(addressLookupTableAccounts)
  return {
    transaction: new VersionedTransaction(message),
    addressLookupTableAccounts
  }
}

// NOTE: The above all need to be updated to use SDK. The below is fresh.

/**
 * In the case of a failed Coinflow withdrawal, transfers the USDC back out of
 * the root Solana account and into the user's user bank account.
 *
 * Note that this uses payment router to do the transfer, so that indexing sees
 * this transfer and handles it appropriately.
 */
type RecoverUsdcFromRootWalletParams = {
  sdk: AudiusSdk
  /** The root wallet key pair */
  sender: Keypair
  /** The ethereum wallet address of the user, used to derive user bank */
  receiverEthWallet: string
  /** The amount of USDC to recover */
  amount: bigint
}
export const recoverUsdcFromRootWallet = async ({
  sdk,
  sender,
  receiverEthWallet,
  amount
}: RecoverUsdcFromRootWalletParams) => {
  const { userBank } =
    await sdk.services.claimableTokensClient.getOrCreateUserBank({
      ethWallet: receiverEthWallet,
      mint: 'USDC'
    })

  // See: https://github.com/solana-labs/solana-program-library/blob/d6297495ea4dcc1bd48f3efdd6e3bbdaef25a495/memo/js/src/index.ts#L27
  const memoInstruction = new TransactionInstruction({
    keys: [
      {
        pubkey: sender.publicKey,
        isSigner: true,
        isWritable: true
      }
    ],
    programId: MEMO_PROGRAM_ID,
    data: Buffer.from(RECOVERY_MEMO_STRING)
  })
  const transferInstruction =
    await sdk.services.paymentRouterClient.createTransferInstruction({
      total: amount,
      sourceWallet: sender.publicKey,
      mint: 'USDC'
    })
  const routeInstruction =
    await sdk.services.paymentRouterClient.createRouteInstruction({
      total: amount,
      splits: [
        {
          amount,
          wallet: userBank
        }
      ],
      mint: 'USDC'
    })
  const transaction = await sdk.services.solanaClient.buildTransaction({
    instructions: [memoInstruction, transferInstruction, routeInstruction]
  })
  transaction.sign([sender])
  const signature = await sdk.services.solanaClient.sendTransaction(
    transaction,
    { skipPreflight: true }
  )
  return signature
}

/**
 * Transfers tokens out of a user bank.
 * Notes:
 * - Including a signer will mark this transfer as a "withdrawal preparation"
 *   by signing a memo indicating such. This prevents the transfer from showing
 *   as a withdrawal on the withdrawal history page.
 * - Users have restrictions on creating token accounts via relay, so if the
 *   destination token account doesn't exist this might fail.
 */
type TransferFromUserBankParams = {
  sdk: AudiusSdk
  /** The token mint address */
  mint: PublicKey
  connection: Connection
  /** Amount, in decimal token amounts (eg dollars for USDC) */
  amount: number
  /** The eth address of the sender (for deriving user bank) */
  ethWallet: string
  /** The destination wallet (not token account but Solana wallet) */
  destinationWallet: PublicKey
  track: CommonStoreContext['analytics']['track']
  make: CommonStoreContext['analytics']['make']
  /** Any extra data to include for analytics */
  analyticsFields: any
  /** If included, will attach a signed memo indicating a recovery transaction.  */
  signer?: Keypair
}

export const transferFromUserBank = async ({
  sdk,
  mint,
  connection,
  amount,
  ethWallet,
  destinationWallet,
  track,
  make,
  analyticsFields,
  signer
}: TransferFromUserBankParams) => {
  let isCreatingTokenAccount = false
  try {
    const instructions: TransactionInstruction[] = []

    const destination = getAssociatedTokenAddressSync(mint, destinationWallet)

    try {
      await getAccount(connection, destination)
    } catch (e) {
      // Throws if token account doesn't exist or account isn't a token account
      isCreatingTokenAccount = true
      console.debug(
        `Associated token account ${destination.toBase58()} does not exist. Creating w/ transfer...`
      )

      // Historically, the token account was created in a separate transaction
      // after swapping USDC to SOL via Jupiter and funded via the root wallet.
      // This is no longer the case. Reusing the same Amplitude events anyway.
      await track(
        make({
          eventName: Name.WITHDRAW_USDC_CREATE_DEST_TOKEN_ACCOUNT_START,
          ...analyticsFields
        })
      )
      const payerKey = await sdk.services.solanaRelay.getFeePayer()
      const createAtaInstruction =
        createAssociatedTokenAccountIdempotentInstruction(
          payerKey,
          destination,
          destinationWallet,
          mint
        )
      instructions.push(createAtaInstruction)
    }

    const secpTransferInstruction =
      await sdk.services.claimableTokensClient.createTransferSecpInstruction({
        auth: sdk.services.auth,
        amount,
        ethWallet,
        mint,
        destination,
        instructionIndex: instructions.length
      })
    instructions.push(secpTransferInstruction)

    const transferInstruction =
      await sdk.services.claimableTokensClient.createTransferInstruction({
        ethWallet,
        mint,
        destination
      })
    instructions.push(transferInstruction)

    if (signer) {
      const memoInstruction = new TransactionInstruction({
        keys: [
          {
            pubkey: signer.publicKey,
            isSigner: true,
            isWritable: true
          }
        ],
        programId: MEMO_PROGRAM_ID,
        data: Buffer.from(PREPARE_WITHDRAWAL_MEMO_STRING)
      })
      instructions.push(memoInstruction)
    }

    const transaction = await sdk.services.solanaClient.buildTransaction({
      instructions
    })

    if (signer) {
      transaction.sign([signer])
    }

    const signature = await sdk.services.claimableTokensClient.sendTransaction(
      transaction
    )

    if (isCreatingTokenAccount) {
      await track(
        make({
          eventName: Name.WITHDRAW_USDC_CREATE_DEST_TOKEN_ACCOUNT_SUCCESS,
          ...analyticsFields
        })
      )
    }

    return signature
  } catch (e) {
    if (isCreatingTokenAccount) {
      await track(
        make({
          eventName: Name.WITHDRAW_USDC_CREATE_DEST_TOKEN_ACCOUNT_FAILED,
          ...analyticsFields,
          error: e instanceof Error ? e.message : e
        })
      )
    }
    throw e
  }
}
