import {
  SystemProgram,
  PublicKey,
  Secp256k1Program,
  SYSVAR_INSTRUCTIONS_PUBKEY,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
  Connection
} from '@solana/web3.js'
import type BN from 'bn.js'
import type { TransactionHandler } from './transactionHandler'
import borsh from 'borsh'
import { SolanaUtils } from './SolanaUtils'
import secp256k1 from 'secp256k1'
import { ClaimableProgramError } from './errors'

const encoder = new TextEncoder()

const TRANSFER_NONCE_PREFIX = 'N_'

type DeriveTransferNonceAccountConfig = {
  ethAddress: string
  mintKey: PublicKey
  claimableTokenProgramKey: PublicKey
}

/**
 * Derives the 'transfer nonce account' - the account which contains the nonce for transfers
 * and is used to prevent replay attacks
 */
export const deriveTransferNonceAccount = async ({
  ethAddress,
  mintKey,
  claimableTokenProgramKey
}: DeriveTransferNonceAccountConfig) => {
  const ethAddressArr = SolanaUtils.ethAddressToArray(ethAddress)
  const seed = Uint8Array.from([
    ...encoder.encode(TRANSFER_NONCE_PREFIX),
    ...ethAddressArr
  ])

  const res = await SolanaUtils.findProgramAddressWithAuthority(
    claimableTokenProgramKey,
    mintKey,
    seed
  )
  return res[1]
}

class NonceAccount {
  version: string
  nonce: unknown

  constructor({ version, nonce }: { version: string; nonce: unknown }) {
    this.version = version
    this.nonce = nonce
  }
}

const NonceAccountSchema = new Map([
  [
    NonceAccount,
    {
      kind: 'struct',
      fields: [
        ['version', 'u8'],
        ['nonce', 'u64']
      ]
    }
  ]
])

type GetAccountNonceParams = {
  connection: Connection
  ethAddress: string
  mintKey: PublicKey
  claimableTokenProgramKey: PublicKey
}

/**
 * Retrieves the nonce account for transfers, if non-existant it returns 0
 */
async function getAccountNonce({
  connection,
  ethAddress,
  mintKey,
  claimableTokenProgramKey
}: GetAccountNonceParams) {
  let nonce = 0
  const transferNonceAccount = await deriveTransferNonceAccount({
    ethAddress,
    mintKey,
    claimableTokenProgramKey
  })
  const accInfo = await connection.getAccountInfoAndContext(
    transferNonceAccount,
    'confirmed'
  )
  if (accInfo.value) {
    const nonceAccount = borsh.deserialize(
      NonceAccountSchema,
      NonceAccount,
      accInfo.value.data
    )
    nonce = nonceAccount.nonce
  }
  return {
    accountNonce: transferNonceAccount,
    nonce
  }
}

type TransferInstructionDataConfig = {
  targetPubKey: Buffer
  amount: BN
  nonce: unknown
}

/**
 * Transfer wAUDIO between wallets on solana
 */
class TransferInstructionData {
  target_pubkey: Buffer
  amount: BN
  nonce: unknown

  constructor({ targetPubKey, amount, nonce }: TransferInstructionDataConfig) {
    this.target_pubkey = targetPubKey
    this.amount = amount
    this.nonce = nonce
  }
}

const transferInstructionDataSchema = new Map([
  [
    TransferInstructionData,
    {
      kind: 'struct',
      fields: [
        ['target_pubkey', [32]], // type pubkey of length 32 bytes
        ['amount', 'u64'],
        ['nonce', 'u64']
      ]
    }
  ]
])

type TransferWAudioBalanceConfig = {
  amount: BN
  senderEthAddress: string
  senderEthPrivateKey: string
  senderSolanaAddress: PublicKey
  recipientSolanaAddress: string
  claimableTokenPDA: PublicKey
  solanaTokenProgramKey: PublicKey
  connection: Connection
  feePayerKey: PublicKey
  claimableTokenProgramKey: PublicKey
  mintKey: PublicKey
  transactionHandler: TransactionHandler
}

/**
 * transferWAudioBalance transfers wrapped Audio from one generated solana account to another.
 * For it to work, you have to have the eth private key belonging to the eth public key
 * that generated the solana account
 */
export async function transferWAudioBalance({
  amount,
  senderEthAddress,
  senderEthPrivateKey,
  senderSolanaAddress,
  recipientSolanaAddress,
  claimableTokenPDA,
  solanaTokenProgramKey,
  feePayerKey,
  claimableTokenProgramKey,
  connection,
  mintKey,
  transactionHandler
}: TransferWAudioBalanceConfig) {
  const senderSolanaPubkey = new PublicKey(senderSolanaAddress)
  const recipientPubkey = new PublicKey(recipientSolanaAddress)

  const { accountNonce, nonce } = await getAccountNonce({
    connection,
    mintKey,
    ethAddress: senderEthAddress,
    claimableTokenProgramKey
  })

  const accounts = [
    // 0. `[sw]` Fee payer
    {
      pubkey: feePayerKey,
      isSigner: true,
      isWritable: false
    },
    // 1. `[w]` Token acc from which tokens will be send (bank account)
    {
      pubkey: senderSolanaPubkey,
      isSigner: false,
      isWritable: true
    },
    // 2. `[w]` Receiver token acc
    {
      pubkey: recipientPubkey,
      isSigner: false,
      isWritable: true
    },
    // 3. `[w]` Nonce Account
    {
      pubkey: accountNonce,
      isSigner: false,
      isWritable: true
    },
    // 4. `[r]` Banks token account authority
    {
      pubkey: claimableTokenPDA,
      isSigner: false,
      isWritable: false
    },
    // 5. `[r]` Sysvar Rent id
    {
      pubkey: SYSVAR_RENT_PUBKEY,
      isSigner: false,
      isWritable: false
    },
    // 6. `[r]` Sysvar instruction id
    {
      pubkey: SYSVAR_INSTRUCTIONS_PUBKEY,
      isSigner: false,
      isWritable: false
    },
    // 7. `[r]` System program id
    {
      pubkey: SystemProgram.programId,
      isSigner: false,
      isWritable: false
    },
    // 8. `[r]` SPL token account id
    {
      pubkey: solanaTokenProgramKey,
      isSigner: false,
      isWritable: false
    }
  ]

  // eth pubkey is different from the ethAddress - addresses are len 20, pub keys are len 64
  const ethPrivateKeyArr = Buffer.from(senderEthPrivateKey, 'hex')
  const ethPubkey = secp256k1.publicKeyCreate(ethPrivateKeyArr, false).slice(1)

  const instructionData = new TransferInstructionData({
    targetPubKey: recipientPubkey.toBuffer(),
    amount,
    nonce
  })

  const serializedInstructionData = borsh.serialize(
    transferInstructionDataSchema,
    instructionData
  )

  const { signature, recoveryId } = SolanaUtils.signBytes(
    Buffer.from(serializedInstructionData),
    senderEthPrivateKey
  )

  const secpTransactionInstruction =
    Secp256k1Program.createInstructionWithPublicKey({
      publicKey: Buffer.from(ethPubkey),
      message: Buffer.from(serializedInstructionData),
      signature,
      recoveryId
    })

  const ethAddressArr = SolanaUtils.ethAddressToArray(senderEthAddress)
  const transferDataInstr = Uint8Array.of(1, ...ethAddressArr)

  const instructions = [
    secpTransactionInstruction,
    new TransactionInstruction({
      keys: accounts,
      programId: claimableTokenProgramKey.toString() as unknown as PublicKey,
      data: Buffer.from(transferDataInstr)
    })
  ]
  return transactionHandler.handleTransaction({
    instructions,
    errorMapping: ClaimableProgramError,
    feePayerOverride: feePayerKey
  })
}
